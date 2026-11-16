(function () {
  "use strict";

  const {Plot, $, css, vec, num, out, bind, initPage} = window.MDS;
  const rootTwo = Math.sqrt(2);
  const rawTeams = [
    {name: "A", x: 8, y: 8},
    {name: "B", x: 2, y: 2},
    {name: "C", x: 6, y: 4},
    {name: "D", x: 4, y: 6}
  ];
  const mean = rawTeams.reduce(
    (total, team) => ({x: total.x + team.x, y: total.y + team.y}),
    {x: 0, y: 0}
  );
  mean.x /= rawTeams.length;
  mean.y /= rawTeams.length;
  const centeredTeams = rawTeams.map(({name, x, y}) => ({
    name, x: x - mean.x, y: y - mean.y
  }));

  function squarePlot(id, min, max, yCenter) {
    const plot = new Plot(id, min, max, 0, 0, 1);
    plot.sq = true;
    plot.yc = yCenter;
    return plot;
  }

  const diagonalPlot = squarePlot("diagonal-plot", -4, 11, 2);
  bind(["first-step", "second-step"], function () {
    const first = out("first-step", 1);
    const second = out("second-step", 1);
    const input = {x: first + second, y: second};
    const image = {x: 2 * first + 3 * second, y: 3 * second};
    const muted = css("--muted");
    const accent = css("--accent");
    const warm = css("--warm");

    diagonalPlot.clear();
    diagonalPlot.seg(0, 0, first, 0, muted, 2, [4, 4]);
    diagonalPlot.seg(first, 0, input.x, input.y, muted, 2, [4, 4]);
    diagonalPlot.arrow(0, 0, 2 * first, 0, accent);
    diagonalPlot.arrow(2 * first, 0, image.x, image.y, warm);
    diagonalPlot.ring(input.x, input.y, muted);
    diagonalPlot.dot(image.x, image.y, warm);
    diagonalPlot.label(input.x, input.y, "input", muted, 10, 14);
    diagonalPlot.label(image.x, image.y, "output", warm);
    $("diagonal-readout").textContent =
      "Input " + vec(input) + " has eigenvector coordinates " + vec({x: first, y: second}) + ".\n" +
      "Double the first (blue), triple the second (orange): " +
      vec({x: 2 * first, y: 3 * second}) + " in the basis.\n" +
      "Rebuild in ordinary coordinates: " + vec(image) + ".";
  });

  const svdPlot = squarePlot("svd-plot", -4, 4, 0);
  const svdLabels = ["Input x", "Input coordinates Vᵀx", "Stretched coordinates ΣVᵀx", "Output Ax"];
  const circle = Array.from({length: 120}, (_, i) => {
    const angle = 2 * Math.PI * i / 120;
    return {x: Math.cos(angle), y: Math.sin(angle)};
  });

  function svdStages({x, y}) {
    const inputCoordinates = {x: (x + y) / rootTwo, y: (x - y) / rootTwo};
    const stretched = {x: 2 * rootTwo * inputCoordinates.x, y: rootTwo * inputCoordinates.y};
    return [{x, y}, inputCoordinates, stretched, {x: -stretched.y, y: stretched.x}];
  }

  bind(["circle-angle", "svd-stage"], function () {
    const angle = out("circle-angle", 0) * Math.PI / 180;
    const stage = Number($("svd-stage").value);
    const selected = svdStages({x: Math.cos(angle), y: Math.sin(angle)});
    const point = selected[stage];
    const accent = css("--accent");
    const warm = css("--warm");

    svdPlot.clear();
    svdPlot.poly(circle, css("--muted"), 0.04);
    svdPlot.poly(circle.map(p => svdStages(p)[stage]), accent, 0.12);
    svdPlot.arrow(0, 0, point.x, point.y, warm);
    svdPlot.label(point.x, point.y, stage === 3 ? "Ax" : "selected", warm);
    $("svd-readout").textContent = svdLabels[stage] + ": " + vec(point) +
      "\nLength at this stage: " + num(Math.hypot(point.x, point.y)) +
      "\nGray circle: length 1. Blue outline: all points at the selected stage.";
  });

  const centerPlot = squarePlot("center-plot", -6, 11, 2.5);
  bind(["center-data"], function () {
    const centered = $("center-data").checked;
    const teams = centered ? centeredTeams : rawTeams;
    const center = centered ? {x: 0, y: 0} : mean;
    const accent = css("--accent");
    const warm = css("--warm");

    centerPlot.clear();
    teams.forEach(team => {
      centerPlot.dot(team.x, team.y, accent);
      centerPlot.label(team.x, team.y, team.name, accent);
    });
    centerPlot.ring(center.x, center.y, warm, 8);
    centerPlot.label(center.x, center.y, "mean", warm, 12, 12);
    $("center-readout").textContent = (centered ? "Centered ratings" : "Raw ratings") +
      "\n" + teams.map(team => team.name + " " + vec(team)).join("  ") +
      "\nMean " + vec(center) + (centered ? " after subtracting " + vec(mean) + "." : ".");
  });

  const pcaPlot = squarePlot("pca-plot", -5, 5, 0);
  const totalVariance = centeredTeams.reduce(
    (sum, team) => sum + team.x ** 2 + team.y ** 2, 0
  ) / (centeredTeams.length - 1);

  bind(["pca-angle"], function () {
    const angle = out("pca-angle", 0) * Math.PI / 180;
    const axis = {x: Math.cos(angle), y: Math.sin(angle)};
    const accent = css("--accent");
    const warm = css("--warm");
    const muted = css("--muted");
    const scores = centeredTeams.map(team => team.x * axis.x + team.y * axis.y);
    const variance = scores.reduce((sum, score) => sum + score ** 2, 0) / (scores.length - 1);

    pcaPlot.clear();
    pcaPlot.seg(-8 * axis.x, -8 * axis.y, 8 * axis.x, 8 * axis.y, warm, 2);
    centeredTeams.forEach((team, index) => {
      const projectedX = scores[index] * axis.x;
      const projectedY = scores[index] * axis.y;
      pcaPlot.seg(team.x, team.y, projectedX, projectedY, muted, 1.5, [4, 4]);
      pcaPlot.ring(projectedX, projectedY, warm, 7);
      pcaPlot.dot(team.x, team.y, accent);
      pcaPlot.label(team.x, team.y, team.name, accent);
    });
    $("pca-readout").textContent = "Scores along the selected axis: " +
      scores.map((score, index) => centeredTeams[index].name + " " + num(score)).join("  ") +
      "\nSample variance along the axis: " + num(variance) + " of " + num(totalVariance) +
      " (" + num(100 * variance / totalVariance) + "%).";
  });

  initPage("mds-m1d-done");
})();
