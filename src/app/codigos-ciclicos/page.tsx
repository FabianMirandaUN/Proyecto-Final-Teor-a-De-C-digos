"use client";
import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { CodeSet } from "@/components/Tables";

const mod = (a: number, p: number) => ((a % p) + p) % p;
function parseNums(s: string) {
  return s
    .split(/[;,\s]+/)
    .map((x) => parseInt(x.trim()))
    .filter((x) => !Number.isNaN(x));
}
function vectors(q: number, k: number, limit = 1500) {
  const out: number[][] = [];
  for (let idx = 0; idx < Math.min(q ** k, limit); idx++) {
    let v = idx;
    const row: number[] = [];
    for (let j = 0; j < k; j++) {
      row.unshift(v % q);
      v = Math.floor(v / q);
    }
    out.push(row);
  }
  return out;
}
function wgt(v: number[]) {
  return v.filter((x) => x !== 0).length;
}
function dist(a: number[], b: number[]) {
  return a.reduce((s, x, i) => s + (x !== b[i] ? 1 : 0), 0);
}
function minD(code: number[][]) {
  let m = Infinity;
  for (let i = 0; i < Math.min(code.length, 300); i++)
    for (let j = i + 1; j < Math.min(code.length, 300); j++)
      m = Math.min(m, dist(code[i], code[j]));
  return m === Infinity ? 0 : m;
}
function uniq(rows: number[][]) {
  const seen = new Set<string>();
  const out: number[][] = [];
  for (const r of rows) {
    const k = r.join(",");
    if (!seen.has(k)) {
      seen.add(k);
      out.push(r);
    }
  }
  return out;
}
function mv(v: number[], M: number[][], p: number) {
  return Array.from({ length: M[0]?.length || 0 }, (_, j) =>
    mod(
      v.reduce((s, x, i) => s + x * M[i][j], 0),
      p
    )
  );
}
function inv(a: number, p: number) {
  a = mod(a, p);
  for (let x = 1; x < p; x++) if (mod(a * x, p) === 1) return x;
  return 0;
}
function rref(A: number[][], p: number) {
  const M = A.map((r) => [...r]);
  let lead = 0,
    pivots: number[] = [];
  for (let r = 0; r < M.length; r++) {
    if (lead >= (M[0]?.length || 0)) break;
    let i = r;
    while (M[i][lead] === 0) {
      i++;
      if (i === M.length) {
        i = r;
        lead++;
        if (lead === (M[0]?.length || 0)) return { M, pivots };
      }
    }
    if (i !== r) [M[i], M[r]] = [M[r], M[i]];
    const iv = inv(M[r][lead], p);
    if (iv) M[r] = M[r].map((x) => mod(x * iv, p));
    for (let i2 = 0; i2 < M.length; i2++) {
      const f = M[i2][lead];
      if (i2 !== r && f !== 0)
        M[i2] = M[i2].map((x, j) => mod(x - f * M[r][j], p));
    }
    pivots.push(lead);
    lead++;
  }
  return { M, pivots };
}
function nullspace(A: number[][], p: number) {
  if (!A.length) return [];
  const { M, pivots } = rref(A, p);
  const cols = A[0].length;
  const free: number[] = [];
  for (let j = 0; j < cols; j++) if (!pivots.includes(j)) free.push(j);
  return free.map((f) => {
    const v = Array(cols).fill(0);
    v[f] = 1;
    pivots.forEach((pc, i) => (v[pc] = mod(-M[i][f], p)));
    return v;
  });
}
function matVec(M: number[][], v: number[], p: number) {
  return M.map((r) =>
    mod(
      r.reduce((s, x, i) => s + x * (v[i] || 0), 0),
      p
    )
  );
}
function puncture(code: number[][], pos: number) {
  return uniq(code.map((c) => c.filter((_, i) => i !== pos)));
}
function shorten(code: number[][], pos: number) {
  return uniq(
    code.filter((c) => c[pos] === 0).map((c) => c.filter((_, i) => i !== pos))
  );
}
function permute(code: number[][], perm: number[]) {
  return code.map((c) => perm.map((i) => c[i] ?? 0));
}
function poly(c: number[]) {
  const t: string[] = [];
  c.forEach((a, i) => {
    if (a === 0) return;
    if (i === 0) t.push(`${a}`);
    else if (i === 1) t.push(a === 1 ? "x" : `${a}x`);
    else t.push(a === 1 ? `x^${i}` : `${a}x^${i}`);
  });
  return t.length ? t.join(" + ") : "0";
}

function parsePoly(s: string) {
  return parseNums(s).map((x) => x % 2);
}
export default function Page() {
  const [n, setN] = useState(7),
    [g, setG] = useState("1,1,0,1"),
    [y, setY] = useState("1,0,1,1,1,0,0"),
    [pp, setPp] = useState(7),
    [sp, setSp] = useState(7);
  const data = useMemo(() => {
    const gen = parsePoly(g);
    const k = Math.max(1, n - gen.length + 1);
    const G = Array.from({ length: k }, (_, i) => {
      const row = Array(n).fill(0);
      gen.forEach((a, j) => (row[(i + j) % n] = a));
      return row;
    });
    const rows = vectors(2, k).map((u) => {
      const cw = mv(u, G, 2);
      return { u, cw, peso: wgt(cw), poly: poly(u) };
    });
    const code = uniq(rows.map((r) => r.cw));
    const H = nullspace(G, 2);
    return { gen, k, G, rows, code, H, d: minD(code) };
  }, [n, g]);
  const yy = parseNums(y).slice(0, n);
  const syn = matVec(data.H, yy, 2);
  const pun = puncture(data.code, pp - 1);
  const red = shorten(data.code, sp - 1);
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Códigos cíclicos dinámicos</span>
        <h1 className="title">Simulador de códigos binarios cíclicos</h1>
        <p className="subtitle">
          Esta sección dinámica permite explorar códigos binarios cíclicos
          modificando la longitud <Latex expr={"n"} /> y el polinomio generador{" "}
          <Latex expr={"g(x)"} />. A partir de estos parámetros, la aplicación
          construye la matriz generadora por desplazamientos, calcula la matriz
          de control, genera las palabras código, obtiene síndromes y permite
          aplicar operaciones como perforación y reducción.
        </p>
      </section>
      <section className="section two">
        <div className="card">
          <h2>1. Parámetros</h2>
          <label>n</label>
          <input
            type="number"
            value={n}
            onChange={(e) => setN(+e.target.value || 1)}
          />
          <label>g(x) coeficientes</label>
          <input value={g} onChange={(e) => setG(e.target.value)} />
          <Latex block expr={`k=n-deg(g)=${data.k}`} />
        </div>
        <div className="card">
          <h2>2. Definición</h2>
          <Latex block expr={"c(x)=m(x)g(x)\\pmod{x^n-1}"} />
        </div>
      </section>
      <section className="section card">
        <h2>3. Matrices y síndrome</h2>
        <MatrixLatex name="G" matrix={data.G} />
        <MatrixLatex name="H" matrix={data.H} />
        <label>y</label>
        <input value={y} onChange={(e) => setY(e.target.value)} />
        <Latex block expr={`s=Hy^t=(${syn.join(",")})`} />
      </section>
      <section className="section card">
        <h2>4. Código generado</h2>
        <Latex block expr={`[n,k,d]\\approx[${n},${data.k},${data.d}]_2`} />
        <CodeSet label="C" codewords={data.code} />
      </section>
      <section className="section two">
        <div className="card">
          <h2>5. Perforación</h2>
          <input
            type="number"
            value={pp}
            onChange={(e) => setPp(+e.target.value || 1)}
          />
          <CodeSet label="C_p" codewords={pun} />
        </div>
        <div className="card">
          <h2>6. Reducción</h2>
          <input
            type="number"
            value={sp}
            onChange={(e) => setSp(+e.target.value || 1)}
          />
          <CodeSet label="C_r" codewords={red} />
        </div>
      </section>
      <section className="section card">
        <h2>7. Tabla de mensajes</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>u</th>
                <th>m(x)</th>
                <th>uG</th>
                <th>Peso</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="mono">({r.u.join(",")})</td>
                  <td className="mono">{r.poly}</td>
                  <td className="mono">({r.cw.join(",")})</td>
                  <td>{r.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </main>
  );
}
