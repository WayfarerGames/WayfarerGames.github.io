(function () {
  if (document.getElementById("bgShapes")) return;

  var bg = document.createElement("div");
  bg.id = "bgShapes";
  bg.className = "bg-shapes";
  document.body.prepend(bg);

  var cols = ["#5AD6FF", "#FF8A66", "#B693FF"];
  var types = ["circle", "square", "triangle"];

  for (var i = 0; i < 16; i++) {
    var d = document.createElement("div");
    var size = Math.random() * 34 + 15;
    var col = cols[Math.floor(Math.random() * cols.length)];
    var t = types[Math.floor(Math.random() * types.length)];
    var shapeStyle = "";

    if (t === "circle") shapeStyle = "border-radius:50%;";
    if (t === "square") shapeStyle = "border-radius:6px;";
    if (t === "triangle") shapeStyle = "clip-path:polygon(50% 0%,0% 100%,100% 100%);";

    d.style.cssText =
      "position:absolute;" +
      "left:" + (Math.random() * 100) + "%;" +
      "top:" + (Math.random() * 100) + "%;" +
      "width:" + size + "px;" +
      "height:" + size + "px;" +
      "background:" + col + ";" +
      "opacity:" + (Math.random() * 0.1 + 0.03) + ";" +
      shapeStyle +
      "animation:float" + ((i % 3) + 1) + " " + (Math.random() * 6 + 5) + "s ease-in-out " + (Math.random() * -8) + "s infinite;";

    bg.appendChild(d);
  }
})();
