import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatPercent, formatMonths, formatNumber } from '@/utils/formatters';

export async function generatePDF() {
  const state = useCalculatorStore.getState();
  const { results, companyProfile, branding, scenarioType, departments, businessCase } = state;
  const currency = companyProfile.currency;
  const companyName = branding.companyName || 'Your Company';

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let pageNum = 1;

  const addHeader = () => {
    pdf.setFillColor(80, 51, 255);
    pdf.rect(0, 0, pageWidth, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('Oneflow ROI Calculator Report', margin, 10);
    pdf.text(`Page ${pageNum}`, pageWidth - margin - 15, 10);
    pdf.setTextColor(0, 0, 0);
    y = 25;
  };

  const newPage = () => {
    pdf.addPage();
    pageNum++;
    addHeader();
  };

  const checkSpace = (needed: number) => {
    if (y + needed > 275) {
      newPage();
    }
  };

  // Page 1: Company Profile Summary
  addHeader();

  pdf.setFontSize(22);
  pdf.setTextColor(80, 51, 255);
  pdf.text('ROI Analysis Report', margin, y + 10);
  y += 18;

  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.text(companyName, margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Scenario: ${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)}`, margin, y);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin + 80, y);
  y += 15;

  // Key metrics
  pdf.setFillColor(245, 243, 255);
  pdf.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
  y += 10;

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  const metrics = [
    { label: 'Total Annual Impact', value: formatCurrency(results.financial.totalAnnualImpact, currency) },
    { label: 'Net Benefit', value: formatCurrency(results.financial.netBenefit, currency) },
    { label: 'ROI', value: formatPercent(results.financial.roiPct) },
    { label: 'Payback Period', value: formatMonths(results.financial.paybackMonths) },
  ];

  metrics.forEach((m, i) => {
    const x = margin + 5 + (contentWidth / 4) * i;
    pdf.text(m.label, x, y);
    pdf.setFontSize(14);
    pdf.setTextColor(80, 51, 255);
    pdf.text(m.value, x, y + 10);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
  });
  y += 35;

  // Efficiency section
  checkSpace(40);
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Efficiency Impact', margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  const effItems = [
    `Annual Hours Saved: ${formatNumber(results.efficiency.annualHoursSaved)} hours`,
    `FTE Equivalent: ${formatNumber(results.efficiency.fteSaved, 1)}`,
    `Cost Savings: ${formatCurrency(results.efficiency.costSavings, currency)}`,
  ];
  effItems.forEach((item) => {
    pdf.text(`  ${item}`, margin, y);
    y += 6;
  });
  y += 5;

  // Revenue section
  checkSpace(40);
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Revenue Impact', margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  const revItems = [
    `Revenue Recovered: ${formatCurrency(results.revenue.revenueRecovered, currency)}`,
    `Revenue Accelerated: ${formatCurrency(results.revenue.revenueAccelerated, currency)}`,
    `Renewal Protected: ${formatCurrency(results.revenue.renewalProtected, currency)}`,
    `Total Revenue Impact: ${formatCurrency(results.revenue.totalRevenueImpact, currency)}`,
  ];
  revItems.forEach((item) => {
    pdf.text(`  ${item}`, margin, y);
    y += 6;
  });
  y += 5;

  // Risk section
  checkSpace(25);
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Risk Reduction', margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`  Avoided Risk Cost: ${formatCurrency(results.risk.avoidedRiskCost, currency)}`, margin, y);
  y += 12;

  // Page 2: Department Breakdown
  newPage();

  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Department Breakdown', margin, y);
  y += 10;

  const selectedDepts = departments.filter((d) => d.selected);
  if (results.byDepartment.length > 0) {
    // Table header
    pdf.setFillColor(80, 51, 255);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('Department', margin + 3, y + 6);
    pdf.text('Hours Saved', margin + 60, y + 6);
    pdf.text('Cost Saved', margin + 100, y + 6);
    pdf.text('Revenue Impact', margin + 140, y + 6);
    y += 10;

    pdf.setTextColor(60, 60, 60);
    results.byDepartment.forEach((dept, i) => {
      if (i % 2 === 0) {
        pdf.setFillColor(248, 248, 252);
        pdf.rect(margin, y - 4, contentWidth, 8, 'F');
      }
      pdf.text(dept.name, margin + 3, y);
      pdf.text(formatNumber(dept.hoursSaved) + ' hrs', margin + 60, y);
      pdf.text(formatCurrency(dept.costSaved, currency), margin + 100, y);
      pdf.text(formatCurrency(dept.revenueImpact, currency), margin + 140, y);
      y += 8;
    });
  }

  // Try to capture charts
  try {
    const chartsEl = document.getElementById('results-charts');
    if (chartsEl) {
      const canvas = await html2canvas(chartsEl, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      newPage();
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 240));
    }
  } catch {
    // Charts capture failed, skip
  }

  // Page 3: Executive Summary (if business case exists)
  if (businessCase) {
    newPage();
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Executive Business Case', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const lines = pdf.splitTextToSize(businessCase, contentWidth);
    lines.forEach((line: string) => {
      checkSpace(7);
      pdf.text(line, margin, y);
      y += 5;
    });
  }

  pdf.save(`${companyName.replace(/\s+/g, '-')}-ROI-Report.pdf`);
}
