var svg = document.getElementById("logo");

function h(n, key, v) {
  let id = n + key;
  if (document.getElementById(id)) {
    n = document.getElementById(id);
  } else {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    n.setAttribute("id", id);
    svg.appendChild(n);
  }

  for (var p in v) n.setAttributeNS(null, p, v[p]);

  return n;
}

let orig_points = [
  [343, 114],
  [441, 99],
  [501, 129],
  [503, 189],
  [471, 244],
  [423, 244],
  [368, 230],
  [332, 169],
  [386, 177],
  [441, 189],
  [434, 134]
];

let params = [];
for (let i = 0; i < orig_points.length; i++) {
  params.push([5 + 5 * Math.random(), 1 * Math.random(), 3 * Math.random()]);
}

function render() {
  let points = [];
  let t = Date.now() / 1000;

  for (let i = 0; i < orig_points.length; i++) {
    let d = params[i];

    points.push([
      orig_points[i][0] + d[0] * Math.sin(t * d[1] + d[2]) - 300,
      orig_points[i][1] + d[0] * Math.sin(t * d[1] + d[2]) - 80
    ]);
  }

  let lines = [
    [0, 7],
    [0, 8],
    [8, 5],
    [8, 6],
    [5, 9],
    [9, 3],
    [9, 4],
    [1, 10],
    [10, 3],
    [10, 2],
    [10, 8]
  ];
  for (let i = 0; i < points.length; i++) {
    lines.push([i, (i + 1) % points.length]);
  }

  for (let i = 0; i < lines.length; i++) {
    h("line", i, {
      x1: points[lines[i][0]][0],
      y1: points[lines[i][0]][1],
      x2: points[lines[i][1]][0],
      y2: points[lines[i][1]][1],
      stroke: "#ddd",
      strokeWidth: 1
    });
  }

  for (let i = 0; i < points.length; i++) {
    h("circle", i, {
      cx: points[i][0],
      cy: points[i][1],
      r: 3,
      fill: "white"
      // fill: 'none',
      // stroke: '#ddd'
    });
  }

  requestAnimationFrame(render);
}

render();
