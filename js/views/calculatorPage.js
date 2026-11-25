import { h } from "../dom.js";
import { friendButton } from "../friends.js";
import { calculatorWidget } from "../components/calculator.js";
import { icon } from "../icons.js";

export function calculatorView(main) {
  main.append(
    h("div", { class: "page-head" }, h("div", { class: "ph-title" }, friendButton("momo", "friend ph-friend"), h("div", null, h("h1", null, "Kalkulator Fungsi Bertahap"),
      h("p", null, "Masukkan rumus dan nilai x. Langkah penyelesaiannya muncul satu per satu.")))),
    h("div", { class: "grid", style: { gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", alignItems: "start" } },
      h("section", { class: "card" }, calculatorWidget({ expr: "-2x + 30", x: "3,5" })),
      h("aside", { class: "card" },
        h("h3", null, "Cara menulis rumus"),
        h("ul", { class: "small", style: { paddingLeft: "18px", margin: 0 } },
          h("li", null, "2x + 3 (tidak perlu tanda ×)"),
          h("li", null, "−2x + 30 atau -2x + 30"),
          h("li", null, "4.500x + 8.000 (titik = ribuan)"),
          h("li", null, "x = 3,5 (koma = desimal)"),
          h("li", null, "x² − 3x + 2 (pakai tombol x²)")),
        h("div", { class: "alert info", style: { marginTop: "12px" } }, icon("bulb"),
          h("div", { class: "small" }, "Pakai kalkulator untuk MENGECEK hitunganmu, setelah kamu mencoba sendiri dulu.")))),
  );
  if (window.matchMedia("(max-width: 900px)").matches) {
    main.querySelector(".grid").style.gridTemplateColumns = "minmax(0, 1fr)";
  }
}
