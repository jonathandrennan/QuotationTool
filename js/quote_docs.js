// quote_docs.js — fund factsheets and KIDs attached to the quotation pack.
//
// The pack is HTML, so to append these PDFs its pages are rendered to images (see qtRasterSrc in quote_pdf.js)
// and built into one PDF with the factsheets / KIDs after them.
//
// Files live under docs/, named by PRSA fund id (see QT_FUND_ALIAS in quote_content.js for the ARF / IB ids):
//   docs/factsheets/<fund>.pdf        AllianzGI / HSBC monthly factsheets
//   docs/kids/<fund>_single.pdf       Investment Bond fund KIDs, single contribution
//   docs/kids/<fund>_recurrent.pdf    Investment Bond fund KIDs, recurrent contribution
//   docs/kids/generic_single.pdf, generic_recurrent.pdf
//   docs/Brochures/<file>             customer brochure for each product (QT_DOCS.brochures)
// Downloaded 09/10/2026 from allianzgloballife.ie (fund centre and Investment Bond pages). Refresh by replacing the
// files and updating the dates below. KIDs are only held for the Investment Bond; no PRSA / ARF KIDs are held yet.
//
// Requires js/vendor/pdf-lib.min.js (only for qtBuildSupportingPdf).

var QT_DOCS = {
  dir: 'docs/',
  // Factsheet "as of" dates, read from each PDF. HSBC ETF factsheets carry no machine-readable date (2026 edition).
  factsheetAsOf: { cash: '31/08/2026', afisd: '31/08/2026', afie: '31/08/2026', ss30: '31/08/2026', ss50: '31/08/2026', ss75: '31/08/2026',
                   dm15: '31/08/2026', dm50: '31/08/2026', dm75: '31/08/2026', bsri: '31/08/2026', etfe: '2026', etfw: '2026', etfs: '2026' },
  kidFunds: ['cash', 'afisd', 'afie', 'ss30', 'ss50', 'ss75', 'dm15', 'dm50', 'dm75', 'bsri', 'etfe', 'etfw', 'etfs'],
  kidProducts: ['ib'],
  // Customer brochure for each product, in docs/Brochures/
  brochures: { prsa: 'PRSA_Customer_Brochure_2026.pdf', arf: 'ARF_Customer_Brochure_2026.pdf', ib: 'Allianz Vantage Investment Bond Customer Brochure.pdf' }
};

function qtDocFundId(id) { return (typeof QT_FUND_ALIAS !== 'undefined' && QT_FUND_ALIAS[id]) || id; }
function qtDocFundName(id) {
  var f = (typeof FUNDS_MAP !== 'undefined' && FUNDS_MAP[id]) || null;
  return f ? f.name : id;
}

// The factsheet for a fund (PRSA, ARF or IB id) as { path, asOf, title }, or null if none is held
function qtFactsheetFor(id) {
  var fid = qtDocFundId(id), asOf = QT_DOCS.factsheetAsOf[fid];
  return asOf ? { path: QT_DOCS.dir + 'factsheets/' + fid + '.pdf', asOf: asOf, title: qtDocFundName(fid) + ' factsheet' } : null;
}

// Funds a PRSA glidepath strategy can invest in over the given term (months to retirement)
function qtGlidepathFunds(gpKey, termMonths) {
  var d = typeof GP_DATA !== 'undefined' ? GP_DATA[gpKey] : null, out = [];
  if (!d) return out;
  var last = Math.min(Math.max(0, termMonths || 0), d.weights.length - 1);
  d.funds.forEach(function(id, i) {
    for (var m = 0; m <= last; m++) { if (d.weights[m][i] > 0) { out.push(id); break; } }
  });
  return out;
}

// Which documents apply to this quotation.
//   o.product    'prsa' | 'arf' | 'ib'
//   o.fundIds    ids of the chosen funds (PRSA, ARF or IB ids) — including glidepath funds
//   o.single, o.regular   (IB) which contribution types are in the quote
// Returns { kids: [doc], factsheets: [doc], all: [doc] } where doc = { key, kind, title, path, fund?, asOf? }
function qtSupportingDocs(o) {
  var seen = {}, ids = [];
  (o.fundIds || []).forEach(function(raw) { var id = qtDocFundId(raw); if (!seen[id]) { seen[id] = 1; ids.push(id); } });
  var kids = [], factsheets = [], product = [];
  if (QT_DOCS.brochures[o.product]) product.push({ key: 'brochure_' + o.product, kind: 'brochure', title: 'Product brochure', path: QT_DOCS.dir + 'Brochures/' + encodeURIComponent(QT_DOCS.brochures[o.product]) });
  if (QT_DOCS.kidProducts.indexOf(o.product) >= 0) {
    var kinds = [];
    if (o.single) kinds.push('single');
    if (o.regular) kinds.push('recurrent');
    kinds.forEach(function(k) {
      var lbl = k === 'single' ? 'single contribution' : 'regular contribution';
      kids.push({ key: 'kid_generic_' + k, kind: 'kid', title: 'Investment Bond KID (' + lbl + ')', path: QT_DOCS.dir + 'kids/generic_' + k + '.pdf' });
      ids.forEach(function(id) {
        if (QT_DOCS.kidFunds.indexOf(id) < 0) return;
        kids.push({ key: 'kid_' + id + '_' + k, kind: 'kid', fund: id, title: qtDocFundName(id) + ' KID (' + lbl + ')', path: QT_DOCS.dir + 'kids/' + id + '_' + k + '.pdf' });
      });
    });
  }
  ids.forEach(function(id) {
    if (!QT_DOCS.factsheetAsOf[id]) return;
    factsheets.push({ key: 'fs_' + id, kind: 'factsheet', fund: id, title: qtDocFundName(id) + ' factsheet', path: QT_DOCS.dir + 'factsheets/' + id + '.pdf', asOf: QT_DOCS.factsheetAsOf[id] });
  });
  return { product: product, kids: kids, factsheets: factsheets };
}

// Fetches the chosen documents and merges them (brochure first, then KIDs, then factsheets) into one PDF, after `pageJpegs`
// (the pack's pages as A4 JPEGs, optional). `include` is { product: bool, kids: bool, factsheets: bool }.
// Resolves to { bytes, count, missing: [title] } where count is the number of documents attached.
function qtBuildSupportingPdf(docs, include, pageJpegs) {
  var list = [].concat(include.product ? docs.product : [], include.kids ? docs.kids : [], include.factsheets ? docs.factsheets : []);
  pageJpegs = pageJpegs || [];
  if (!list.length && !pageJpegs.length) return Promise.reject(new Error('No documents selected.'));
  if (typeof PDFLib === 'undefined') return Promise.reject(new Error('The PDF library could not be loaded.'));
  var missing = [];
  return Promise.all(list.map(function(d) {
    return fetch(d.path).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function(buf) { return { doc: d, buf: buf }; })
      .catch(function() { missing.push(d.title); return null; });
  })).then(function(res) {
    var got = res.filter(Boolean);
    if (!got.length && list.length && !pageJpegs.length) {
      var e = new Error('The documents could not be loaded. The tool needs to be opened from the web server (not as a local file).');
      e.missing = missing; throw e;
    }
    return PDFLib.PDFDocument.create().then(function(out) {
      return pageJpegs.reduce(function(chain, jpg) {
        return chain.then(function() { return out.embedJpg(new Uint8Array(jpg)); }).then(function(img) {
          out.addPage([595.28, 841.89]).drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
        });
      }, Promise.resolve()).then(function() { return got.reduce(function(chain, g) {
        return chain.then(function() {
          return PDFLib.PDFDocument.load(g.buf, { ignoreEncryption: true })
            .then(function(src) { return out.copyPages(src, src.getPageIndices()); })
            .then(function(pages) { pages.forEach(function(p) { out.addPage(p); }); })
            .catch(function() { missing.push(g.doc.title); });
        });
      }, Promise.resolve()); }).then(function() {
        return out.save().then(function(bytes) { return { bytes: bytes, count: list.length - missing.length, missing: missing }; });
      });
    });
  });
}
