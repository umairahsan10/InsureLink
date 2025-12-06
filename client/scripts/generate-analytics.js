const fs = require('fs');
const path = require('path');

const claimsPath = path.join(__dirname, '..', 'src', 'data', 'claims.json');
const outPath = path.join(__dirname, '..', 'src', 'data', 'analytics.json');

function loadClaims() {
  const raw = fs.readFileSync(claimsPath, 'utf8');
  return JSON.parse(raw);
}

function formatMonth(dateString) {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function generate() {
  const claims = loadClaims();
  const totalClaims = claims.length;
  const claimsByStatus = { Pending: 0, Approved: 0, Rejected: 0 };
  let totalClaimValue = 0;
  let approvedValueTotal = 0;
  const monthly = {};
  const perCorporate = {};
  const perHospital = {};
  let fraudFlaggedCount = 0;

  for (const c of claims) {
    const status = c.status || 'Pending';
    if (claimsByStatus[status] !== undefined) claimsByStatus[status]++;
    else claimsByStatus[status] = 1;

    const amount = Number(c.amountClaimed || 0);
    totalClaimValue += amount;
    if (status === 'Approved') approvedValueTotal += Number(c.approvedAmount || 0);

    const month = formatMonth(c.createdAt || c.admissionDate || c.date || new Date().toISOString());
    monthly[month] = monthly[month] || { count: 0, value: 0 };
    monthly[month].count += 1;
    monthly[month].value += amount;

    perCorporate[c.corporateId] = perCorporate[c.corporateId] || { corporateId: c.corporateId, corporateName: c.corporateName || c.corporateId, count: 0, value: 0 };
    perCorporate[c.corporateId].count += 1;
    perCorporate[c.corporateId].value += amount;

    perHospital[c.hospitalId] = perHospital[c.hospitalId] || { hospitalId: c.hospitalId, hospitalName: c.hospitalName || c.hospitalId, totalAmount: 0 };
    perHospital[c.hospitalId].totalAmount += amount;

    if (typeof c.fraudRiskScore === 'number' && c.fraudRiskScore > 0.3) fraudFlaggedCount++;
  }

  const monthlyTrends = Object.keys(monthly).sort().map((m) => ({ month: m, count: monthly[m].count, value: monthly[m].value }));
  const claimsPerCorporate = Object.values(perCorporate).map((v) => ({ ...v }));
  const topHospitalsByAmount = Object.values(perHospital).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3);
  const rejectionRate = totalClaims === 0 ? 0 : (claimsByStatus['Rejected'] || 0) / totalClaims;

  const out = {
    claimsByStatus,
    totalClaims,
    totalClaimValue,
    approvedValueTotal,
    monthlyTrends,
    topHospitalsByAmount,
    claimsPerCorporate,
    rejectionRate,
    fraudFlaggedCount,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote analytics to', outPath);
}

if (require.main === module) generate();

module.exports = { generate };
