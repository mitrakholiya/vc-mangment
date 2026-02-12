import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VcUserMonthly {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  monthly_contribution: number;
  loan_amount: number;
  loan_monthly_emi: number;
  loan_interest: number;
  part_payment: number;
  remaining_loan: number;
  last_month_remaining_loan: number;
  total_payable: number;
  month: number;
  year: number;
  status: string;
}

export const shareMonthlyPdf = async (
  data: VcUserMonthly[],
  monthName: string,
  year: number,
  ventureName: string = "VC Management",
  summaryData?: {
    totalCollection: number;
    totalLoans: number;
    totalExiting: number;
    remainingBalance: number;
    lastMonthBalance: number;
  },
  newLoans?: { name: string; loan_amount: number }[],
  action: "share" | "download" = "share",
) => {
  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(ventureName, 14, 22);
    doc.setFontSize(14);
    doc.text(`${monthName} ${year} - Monthly Summary`, 14, 30);

    // Prepare Table Data
    const tableColumn = [
      "No",
      "Name",
      "Hapto",
      "Loan",
      "Last Pend",
      "L. Hapto",
      "Vyaj",
      "Part Pay",
      "Rem Loan",
      "Payable",
    ];

    const tableRows: any[] = [];

    data.forEach((row, index) => {
      const rowData = [
        index + 1,
        row.user_id?.name || "Unknown",
        row.monthly_contribution.toLocaleString(),
        row.loan_amount > 0 ? row.loan_amount.toLocaleString() : "-",
        row.last_month_remaining_loan > 0
          ? row.last_month_remaining_loan.toLocaleString()
          : "-",
        row.loan_monthly_emi > 0 ? row.loan_monthly_emi.toLocaleString() : "-",
        row.loan_interest > 0 ? row.loan_interest.toLocaleString() : "-",
        row.part_payment > 0 ? row.part_payment.toLocaleString() : "-",
        row.remaining_loan > 0 ? row.remaining_loan.toLocaleString() : "-",
        row.total_payable.toLocaleString(),
      ];
      tableRows.push(rowData);
    });

    // Add Totals Row
    const totalRow = [
      "",
      "Total",
      data.reduce((sum, r) => sum + r.monthly_contribution, 0).toLocaleString(),
      data.reduce((sum, r) => sum + r.loan_amount, 0).toLocaleString(),
      data
        .reduce((sum, r) => sum + r.last_month_remaining_loan, 0)
        .toLocaleString(),
      data.reduce((sum, r) => sum + r.loan_monthly_emi, 0).toLocaleString(),
      data.reduce((sum, r) => sum + r.loan_interest, 0).toLocaleString(),
      data.reduce((sum, r) => sum + r.part_payment, 0).toLocaleString(),
      data.reduce((sum, r) => sum + r.remaining_loan, 0).toLocaleString(),
      data.reduce((sum, r) => sum + r.total_payable, 0).toLocaleString(),
    ];
    tableRows.push(totalRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66] },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      showFoot: "lastPage",
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add New Loans Table
    let currentY = finalY;
    if (newLoans && newLoans.length > 0) {
      doc.setFontSize(14);
      doc.text("New Loans Breakdown", 14, currentY);

      const loanRows = newLoans.map((loan) => [
        loan.name,
        `-${loan.loan_amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        head: [["Name", "Amount"]],
        body: loanRows,
        startY: currentY + 5,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [40, 40, 40] }, // Red header for loans
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Financial Summary
    if (summaryData) {
      const summaryBody = [
        [
          "Last Month Balance",
          `+${summaryData.lastMonthBalance.toLocaleString()}`,
        ],
        [
          "Current Collection",
          `+${summaryData.totalCollection.toLocaleString()}`,
        ],
        ["Total Loans (Out)", `-${summaryData.totalLoans.toLocaleString()}`],
      ];

      if (summaryData.totalExiting > 0) {
        summaryBody.push([
          "Exiting Members (Out)",
          `-${summaryData.totalExiting.toLocaleString()}`,
        ]);
      }

      summaryBody.push([
        "Remaining Balance",
        `${summaryData.remainingBalance.toLocaleString()}`,
      ]);

      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: summaryBody,
        startY: currentY,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 50, halign: "right" },
        },
        headStyles: { fillColor: [40, 40, 40] },
      });
    }

    // Save or Share
    if (action === "download") {
      doc.save(`${monthName}_${year}_Summary.pdf`);
    } else if (navigator.share && navigator.canShare) {
      const blob = doc.output("blob");
      const file = new File([blob], `${monthName}_${year}_Summary.pdf`, {
        type: "application/pdf",
      });

      const shareData = {
        files: [file],
        title: `${monthName} ${year} Summary`,
        text: `Here is the monthly summary for ${monthName} ${year}.`,
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        doc.save(`${monthName}_${year}_Summary.pdf`);
      }
    } else {
      doc.save(`${monthName}_${year}_Summary.pdf`);
    }
  } catch (error) {
    console.error("Error generating/sharing PDF:", error);
    alert("Failed to share PDF. It will be downloaded instead.");
  }
};
