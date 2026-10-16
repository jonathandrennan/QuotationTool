"""Minimal Excel COM driver for the parity test (pywin32).

Always works on a *copy* of the workbook in a temp folder, starts its own hidden Excel
instance (DispatchEx — never attaches to a user's running Excel), and always quits it,
killing only its own EXCEL.EXE PID if Quit does not take.
"""
import os, shutil, tempfile, time, datetime
import pythoncom
import win32com.client
import win32process
import win32api, win32con

XL_CALC_MANUAL = -4135


def _is_err(v):
    # COM returns Excel error values (#N/A, #VALUE! ...) as negative ints around -2146826xxx
    return isinstance(v, int) and v <= -2146826200


def _clean(v):
    if _is_err(v):
        return '#ERR'
    if isinstance(v, datetime.datetime):
        return v.strftime('%Y-%m-%d')
    return v


class ExcelSession:
    def __init__(self, src_path):
        self.src = os.path.abspath(src_path)
        self.tmpdir = tempfile.mkdtemp(prefix='qt_parity_')
        self.path = os.path.join(self.tmpdir, os.path.basename(self.src))
        shutil.copy2(self.src, self.path)
        self.xl = self.wb = None
        self.pid = None

    def __enter__(self):
        pythoncom.CoInitialize()
        self.xl = win32com.client.DispatchEx('Excel.Application')
        try:
            self.pid = win32process.GetWindowThreadProcessId(self.xl.Hwnd)[1]
        except Exception:
            self.pid = None
        self.xl.Visible = False
        self.xl.DisplayAlerts = False
        self.xl.ScreenUpdating = False
        self.xl.EnableEvents = False
        self.xl.AskToUpdateLinks = False
        # UpdateLinks=0: keep the cached values of the external glidepath links ([2] in the PRSA book)
        self.wb = self.xl.Workbooks.Open(self.path, 0, False)
        self.xl.Calculation = XL_CALC_MANUAL
        return self

    def __exit__(self, *exc):
        try:
            if self.wb is not None:
                self.wb.Close(False)
        except Exception:
            pass
        try:
            if self.xl is not None:
                self.xl.Quit()
        except Exception:
            pass
        self.wb = self.xl = None
        pythoncom.CoUninitialize()
        if self.pid:
            for _ in range(40):
                if not _pid_alive(self.pid):
                    break
                time.sleep(0.25)
            else:
                _kill(self.pid)
        shutil.rmtree(self.tmpdir, ignore_errors=True)
        return False

    def set(self, sheet, addr, value):
        rng = self.wb.Worksheets(sheet).Range(addr)
        if isinstance(value, datetime.date):
            rng.Formula = '=DATE(%d,%d,%d)' % (value.year, value.month, value.day)
        elif value is None:
            rng.ClearContents()
        else:
            rng.Value2 = value

    def formula(self, sheet, addr):
        return self.wb.Worksheets(sheet).Range(addr).Formula

    def calc(self):
        self.xl.CalculateFull()

    def get(self, sheet, addr):
        return _clean(self.wb.Worksheets(sheet).Range(addr).Value2)

    def block(self, sheet, addr):
        v = self.wb.Worksheets(sheet).Range(addr).Value2
        return [[_clean(x) for x in row] for row in v]


def _pid_alive(pid):
    try:
        h = win32api.OpenProcess(win32con.SYNCHRONIZE | 0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    except Exception:
        return False
    try:
        import win32event
        return win32event.WaitForSingleObject(h, 0) != 0  # WAIT_OBJECT_0 (0) = exited
    except Exception:
        return True   # unknown -> treat as alive so the caller kills its own PID
    finally:
        win32api.CloseHandle(h)


def _kill(pid):
    try:
        h = win32api.OpenProcess(win32con.PROCESS_TERMINATE, False, pid)
        win32api.TerminateProcess(h, 1)
        win32api.CloseHandle(h)
    except Exception:
        pass
