import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MemberPayment {
  amount: number;
  date: string | Date;
}

interface LeavingMember {
  user_id: {
    name: string;
    email: string;
  };
  total_monthly_contribution: number;
  remaining_loan: number;
  total_vyaj: number;
  unpaid_amount: number;
  total_paid: MemberPayment[];
}

export const shareMemberStatementPdf = async (
  member: LeavingMember,
  ventureName: string = "VC Management",
  action: "share" | "download" = "share",
) => {
  try {
    const doc = new jsPDF();

    // Theme Colors (RGB)
    const PRIMARY_COLOR: [number, number, number] = [4, 89, 74]; // #04594A
    const SECONDARY_COLOR: [number, number, number] = [191, 146, 39]; // #BF9227

    // Title
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(ventureName.toUpperCase(), 14, 22);

    // Decorative line
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);

    // Subtitle
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Member Closure Statement", 14, 32);

    // Member Details Section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Member Information", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${member.user_id?.name || "Unknown"}`, 14, 52);
    doc.text(`Email: ${member.user_id?.email || "N/A"}`, 14, 57);
    doc.text(
      `Date of Closure: ${new Date().toLocaleDateString("en-IN")}`,
      14,
      62,
    );

    // Financial Summary Table
    const summaryRows = [
      [
        "Total Monthly Contribution",
        `+ ${member.total_monthly_contribution.toLocaleString()}`,
      ],
      
      [
        "Total Interest Accrued (Vyaj)",
        `+ ${member.total_vyaj.toLocaleString()}`,
      ],
      [
        "Remaining Loan Principal",
        `- ${member.remaining_loan.toLocaleString()}`,
      ],
      ["", ""], // Spacer
      ["FINAL UNPAID BALANCE", `INR ${member.unpaid_amount.toLocaleString()}`],
    ];

    autoTable(doc, {
      body: summaryRows,
      startY: 70,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 4,
        font: "helvetica",
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === 4) {
          data.cell.styles.fontSize = 12;
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fillColor = [245, 245, 245];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Payment History Section
    if (member.total_paid && member.total_paid.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Settlement Payment History", 14, finalY);

      const paymentRows = member.total_paid.map((p, idx) => [
        idx + 1,
        new Date(p.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        p.amount.toLocaleString(),
      ]);

      autoTable(doc, {
        head: [["No", "Date", "Amount (INR)"]],
        body: paymentRows,
        startY: finalY + 5,
        theme: "grid",
        headStyles: {
          fillColor: PRIMARY_COLOR,
          textColor: [255, 255, 255],
        },
        styles: {
          fontSize: 9,
        },
      });
    }

    // Footer/Disclaimer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "This is a computer-generated statement and does not require a physical signature.",
      14,
      pageHeight - 15,
    );
    doc.text(
      `Generated via ${ventureName} System on ${new Date().toLocaleString()}`,
      14,
      pageHeight - 10,
    );

    const fileName = `${member.user_id?.name || "Member"}_Closure_Statement.pdf`;

    // Save or Share
    if (action === "download") {
      doc.save(fileName);
    } else if (navigator.share && navigator.canShare) {
      const blob = doc.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      const shareData = {
        files: [file],
        title: `Closure Statement - ${member.user_id?.name}`,
        text: `Here is the membership closure statement for ${member.user_id?.name}.`,
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        doc.save(fileName);
      }
    } else {
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating/sharing PDF:", error);
    alert("Failed to share PDF. It will be downloaded instead.");
  }
};
