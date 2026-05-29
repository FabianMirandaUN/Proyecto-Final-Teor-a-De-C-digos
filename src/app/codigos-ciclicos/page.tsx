"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { CodeSet } from "@/components/Tables";

const MAX_MESSAGES = 5000;

const mod = (a: number, p: number) => ((a % p) + p) % p;

function parseNums(s: string) {
  return s
    .split(/[;,\s]+/)
    .map((x) => parseInt(x.trim()))
    .filter((x) => !Number.isNaN(x));
}

function vectors(q: number, k: number, limit = MAX_MESSAGES) {
  const out: number[][] = [];
  const total = q ** k;
  const max = Math.min(total, limit);

  for (let idx = 0; idx < max; idx++) {
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

  for (let i = 0; i < code.length; i++) {
    for (let j = i + 1; j < code.length; j++) {
      m = Math.min(m, dist(code[i], code[j]));
    }
  }

  return m === Infinity ? 0 : m;
}

function uniq(rows: number[][]) {
  const seen = new Set<string>();
  const out: number[][] = [];

  for (const r of rows) {
    const key = r.join(",");

    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }

  return out;
}

function mv(v: number[], M: number[][], p: number) {
  return Array.from({ length: M[0]?.length || 0 }, (_, j) =>
    mod(
      v.reduce((s, x, i) => s + x * (M[i]?.[j] ?? 0), 0),
      p
    )
  );
}

function inv(a: number, p: number) {
  a = mod(a, p);

  for (let x = 1; x < p; x++) {
    if (mod(a * x, p) === 1) return x;
  }

  return 0;
}

function rref(A: number[][], p: number) {
  const M = A.map((r) => [...r]);
  let lead = 0;
  const pivots: number[] = [];

  for (let r = 0; r < M.length; r++) {
    if (lead >= (M[0]?.length || 0)) break;

    let i = r;

    while (M[i]?.[lead] === 0) {
      i++;

      if (i === M.length) {
        i = r;
        lead++;

        if (lead === (M[0]?.length || 0)) {
          return { M, pivots };
        }
      }
    }

    if (i !== r) {
      [M[i], M[r]] = [M[r], M[i]];
    }

    const iv = inv(M[r][lead], p);

    if (iv) {
      M[r] = M[r].map((x) => mod(x * iv, p));
    }

    for (let i2 = 0; i2 < M.length; i2++) {
      const f = M[i2][lead];

      if (i2 !== r && f !== 0) {
        M[i2] = M[i2].map((x, j) => mod(x - f * M[r][j], p));
      }
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

  for (let j = 0; j < cols; j++) {
    if (!pivots.includes(j)) free.push(j);
  }

  return free.map((f) => {
    const v = Array(cols).fill(0);
    v[f] = 1;

    pivots.forEach((pc, i) => {
      v[pc] = mod(-M[i][f], p);
    });

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

function trimPoly(a: number[]) {
  const p = a.map((x) => mod(x, 2));

  while (p.length > 1 && p[p.length - 1] === 0) {
    p.pop();
  }

  return p;
}

function parsePoly(s: string) {
  const parsed = parseNums(s).map((x) => mod(x, 2));
  return trimPoly(parsed.length ? parsed : [0]);
}

function degree(poly: number[]) {
  const p = trimPoly(poly);

  if (p.length === 1 && p[0] === 0) return -1;

  return p.length - 1;
}

function polyToLatex(coeffs: number[]) {
  const p = trimPoly(coeffs);
  const terms: string[] = [];

  p.forEach((a, i) => {
    if (a === 0) return;

    if (i === 0) terms.push("1");
    else if (i === 1) terms.push("x");
    else terms.push(`x^${i}`);
  });

  return terms.length ? terms.join("+") : "0";
}

function polyDivMod(dividendInput: number[], divisorInput: number[]) {
  let dividend = trimPoly([...dividendInput]);
  const divisor = trimPoly([...divisorInput]);

  const dDivisor = degree(divisor);

  if (dDivisor < 0) {
    return {
      quotient: [0],
      remainder: dividend,
    };
  }

  let quotient = Array(Math.max(1, dividend.length - divisor.length + 1)).fill(0);

  while (degree(dividend) >= dDivisor && !(dividend.length === 1 && dividend[0] === 0)) {
    const shift = degree(dividend) - dDivisor;
    quotient[shift] = 1;

    for (let i = 0; i < divisor.length; i++) {
      dividend[i + shift] = mod((dividend[i + shift] || 0) - divisor[i], 2);
    }

    dividend = trimPoly(dividend);
  }

  return {
    quotient: trimPoly(quotient),
    remainder: trimPoly(dividend),
  };
}

function dividesXnMinus1(g: number[], n: number) {
  if (degree(g) < 0) return false;

  const xnMinus1 = Array(n + 1).fill(0);

  // En F2 se cumple x^n - 1 = x^n + 1.
  xnMinus1[0] = 1;
  xnMinus1[n] = 1;

  const { remainder } = polyDivMod(xnMinus1, g);

  return remainder.length === 1 && remainder[0] === 0;
}

function cyclicShiftRight(v: number[]) {
  if (!v.length) return [];
  return [v[v.length - 1], ...v.slice(0, -1)];
}

function isCyclicClosed(code: number[][]) {
  const set = new Set(code.map((c) => c.join(",")));

  return code.every((c) => set.has(cyclicShiftRight(c).join(",")));
}

function normalizeWord(text: string, n: number) {
  const parsed = parseNums(text).map((x) => mod(x, 2));
  const word = [...parsed];

  while (word.length < n) {
    word.push(0);
  }

  return word.slice(0, n);
}

function clampPosition(pos: number, n: number) {
  if (Number.isNaN(pos)) return 1;
  return Math.min(Math.max(pos, 1), Math.max(n, 1));
}

export default function Page() {
  const [n, setN] = useState(7);
  const [g, setG] = useState("1,1,0,1");
  const [y, setY] = useState("1,0,1,1,1,0,0");
  const [pp, setPp] = useState(7);
  const [sp, setSp] = useState(7);

  const safeN = Math.max(n, 1);

  const data = useMemo(() => {
    const gen = parsePoly(g);
    const degG = degree(gen);
    const validDegree = degG >= 0 && degG < safeN;
    const k = validDegree ? safeN - degG : 1;
    const totalMessages = 2 ** k;
    const completeGeneration = totalMessages <= MAX_MESSAGES;

    const G = validDegree
      ? Array.from({ length: k }, (_, i) => {
          const row = Array(safeN).fill(0);

          gen.forEach((a, j) => {
            if (i + j < safeN) {
              row[i + j] = a;
            }
          });

          return row;
        })
      : [];

    const rows = validDegree
      ? vectors(2, k).map((u) => {
          const cw = mv(u, G, 2);

          return {
            u,
            cw,
            peso: wgt(cw),
            poly: poly(u),
          };
        })
      : [];

    const code = uniq(rows.map((r) => r.cw));
    const H = validDegree ? nullspace(G, 2) : [];
    const generatorDivides = validDegree ? dividesXnMinus1(gen, safeN) : false;
    const cyclicClosed = validDegree ? isCyclicClosed(code) : false;

    return {
      gen,
      degG,
      k,
      G,
      rows,
      code,
      H,
      d: completeGeneration ? minD(code) : minD(code),
      totalMessages,
      completeGeneration,
      validDegree,
      generatorDivides,
      cyclicClosed,
    };
  }, [safeN, g]);

  const yy = normalizeWord(y, safeN);
  const syn = matVec(data.H, yy, 2);

  const puncturePosition = clampPosition(pp, safeN);
  const reductionPosition = clampPosition(sp, safeN);

  const pun = data.validDegree ? puncture(data.code, puncturePosition - 1) : [];
  const red = data.validDegree ? shorten(data.code, reductionPosition - 1) : [];

  const rawY = parseNums(y);
  const validN = safeN >= 1;
  const validGeneratorNonZero = data.degG >= 0;
  const validGeneratorDegree = data.validDegree;
  const validYLength = rawY.length === safeN;
  const validPuncture = pp >= 1 && pp <= safeN;
  const validReduction = sp >= 1 && sp <= safeN;

  const isCyclicCode =
    validN &&
    validGeneratorNonZero &&
    validGeneratorDegree &&
    data.generatorDivides &&
    data.cyclicClosed;

  const validationMessages = [
    !validN
      ? "Se recomienda corregir n: la longitud debe ser al menos 1."
      : null,
    !validGeneratorNonZero
      ? "Se recomienda corregir g(x): el polinomio generador no puede ser el polinomio cero."
      : null,
    !validGeneratorDegree
      ? `Se recomienda corregir g(x) o n: debe cumplirse deg(g)<n. Actualmente deg(g)=${data.degG} y n=${safeN}.`
      : null,
    validGeneratorDegree && !data.generatorDivides
      ? `Se recomienda corregir g(x): para un código cíclico estándar, g(x) debe dividir a x^${safeN}-1 sobre F2.`
      : null,
    validGeneratorDegree && !data.cyclicClosed
      ? "Advertencia: las palabras generadas no están cerradas bajo desplazamiento cíclico."
      : null,
    !validYLength
      ? `Se recomienda corregir y: la palabra recibida debe tener longitud n=${safeN}. Actualmente tiene ${rawY.length} coordenadas; la aplicación completa o recorta para calcular el síndrome.`
      : null,
    !validPuncture
      ? `Se recomienda corregir la coordenada de perforación: debe estar entre 1 y ${safeN}.`
      : null,
    !validReduction
      ? `Se recomienda corregir la coordenada de reducción: debe estar entre 1 y ${safeN}.`
      : null,
    !data.completeGeneration
      ? `Advertencia: el espacio de mensajes tiene ${data.totalMessages} elementos. Para mantener la página estable, se generan los primeros ${MAX_MESSAGES}.`
      : null,
  ].filter(Boolean);

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

          <label>Longitud n</label>

          <input
            type="number"
            value={n}
            onChange={(e) => setN(+e.target.value || 1)}
          />

          <label>g(x) coeficientes</label>

          <input value={g} onChange={(e) => setG(e.target.value)} />

          <Latex block expr={`g(x)=${polyToLatex(data.gen)}`} />

          <Latex block expr={`\\deg(g)=${data.degG}`} />

          <Latex block expr={`k=n-\\deg(g)=${data.k}`} />

          <div className="algo-box">
            <h3>¿Qué significa cada parámetro?</h3>

            <ul>
              <li>
                <strong>
                  <Latex expr={"n"} />:
                </strong>{" "}
                longitud del código. Cada palabra código tiene{" "}
                <Latex expr={"n"} /> coordenadas.
              </li>

              <li>
                <strong>
                  <Latex expr={"g(x)"} />:
                </strong>{" "}
                polinomio generador. Para un código cíclico estándar debe
                dividir a <Latex expr={"x^n-1"} /> en{" "}
                <Latex expr={"\\mathbb{F}_2[x]"} />.
              </li>

              <li>
                <strong>
                  <Latex expr={"k"} />:
                </strong>{" "}
                dimensión del código. Se calcula mediante{" "}
                <Latex expr={"k=n-\\deg(g)"} />.
              </li>

              <li>
                <strong>
                  Coeficientes:
                </strong>{" "}
                se escriben de menor a mayor grado. Por ejemplo,{" "}
                <Latex expr={"1,1,0,1"} /> representa{" "}
                <Latex expr={"1+x+x^3"} />.
              </li>
            </ul>
          </div>

          <span className={validGeneratorDegree ? "pill ok" : "pill warn"}>
            {validGeneratorDegree
              ? "deg(g)<n"
              : "Corregir: debe cumplirse deg(g)<n"}
          </span>

          <span className={data.generatorDivides ? "pill ok" : "pill warn"}>
            {data.generatorDivides
              ? "g(x) divide a x^n-1"
              : "Revisar g(x): no divide a x^n-1"}
          </span>

          <span className={data.cyclicClosed ? "pill ok" : "pill warn"}>
            {data.cyclicClosed
              ? "Cierre cíclico verificado"
              : "No se verifica cierre cíclico"}
          </span>

          <span className={isCyclicCode ? "pill ok" : "pill warn"}>
            {isCyclicCode
              ? "Sí es un código cíclico binario estándar"
              : "No es cíclico estándar con estos parámetros"}
          </span>

          <span className="pill">
            Mensajes generados: {data.rows.length} de {data.totalMessages}
          </span>

          {validationMessages.length > 0 && (
            <div className="algo-box">
              <h3>Recomendaciones de corrección</h3>

              <ul>
                {validationMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <h2>2. Definición</h2>

          <Latex block expr={"c(x)=m(x)g(x)\\pmod{x^n-1}"} />

          <Latex block expr={`C=\\langle g(x)\\rangle\\subseteq \\mathbb{F}_2[x]/(x^{${safeN}}-1)`} />

          <p className="text">
            Un código binario cíclico de longitud <Latex expr={"n"} /> se
            estudia dentro del anillo cociente{" "}
            <Latex expr={"\\mathbb{F}_2[x]/(x^n-1)"} />. Para que el código sea
            cíclico estándar, el polinomio generador debe dividir a{" "}
            <Latex expr={"x^n-1"} />.
          </p>
        </div>
      </section>

      <section className="section card">
        <h2>3. Matrices y síndrome</h2>

        <MatrixLatex name="G" matrix={data.G} />
        <MatrixLatex name="H" matrix={data.H} />

        <label>Palabra recibida y</label>

        <input value={y} onChange={(e) => setY(e.target.value)} />

        <Latex block expr={`y=(${yy.join(",")})`} />
        <Latex block expr={`s=Hy^t=(${syn.join(",")})`} />

        <span className={validYLength ? "pill ok" : "pill warn"}>
          {validYLength
            ? "y tiene longitud correcta"
            : "Revisar y: longitud distinta de n"}
        </span>

        <span className={syn.every((x) => x === 0) ? "pill ok" : "pill warn"}>
          {syn.every((x) => x === 0)
            ? "Síndrome cero: y pertenece al código"
            : "Síndrome no cero: y no pertenece al código o contiene error"}
        </span>
      </section>

      <section className="section card">
        <h2>4. Código generado</h2>

        <Latex
          block
          expr={`[n,k,d]\\approx[${safeN},${data.k},${data.d}]_2`}
        />

        <CodeSet label="C" codewords={data.code} />
      </section>

      <section className="section two">
        <div className="card">
          <h2>5. Perforación</h2>

          <label>Coordenada</label>

          <input
            type="number"
            value={pp}
            min={1}
            max={safeN}
            onChange={(e) => setPp(+e.target.value || 1)}
          />

          <span className={validPuncture ? "pill ok" : "pill warn"}>
            {validPuncture
              ? "Coordenada válida"
              : "Revisar coordenada de perforación"}
          </span>

          <p className="mini">
            Se elimina la coordenada{" "}
            <Latex expr={`i=${puncturePosition}`} /> de cada palabra código.
          </p>

          <CodeSet
            label={`\\mathring{C}(${puncturePosition})`}
            codewords={pun}
          />
        </div>

        <div className="card">
          <h2>6. Reducción</h2>

          <label>Coordenada</label>

          <input
            type="number"
            value={sp}
            min={1}
            max={safeN}
            onChange={(e) => setSp(+e.target.value || 1)}
          />

          <span className={validReduction ? "pill ok" : "pill warn"}>
            {validReduction
              ? "Coordenada válida"
              : "Revisar coordenada de reducción"}
          </span>

          <p className="mini">
            Se conservan las palabras cuya coordenada{" "}
            <Latex expr={`i=${reductionPosition}`} /> es cero y luego se elimina
            dicha coordenada.
          </p>

          <CodeSet
            label={`\\breve{C}(${reductionPosition})`}
            codewords={red}
          />
        </div>
      </section>

      <section className="section card">
        <h2>7. Tabla de mensajes</h2>

        <p className="text">
          La tabla muestra cada mensaje <Latex expr={"u"} />, el polinomio{" "}
          <Latex expr={"m(x)"} /> asociado, la palabra código obtenida y su peso
          de Hamming.
        </p>

        {!data.completeGeneration && (
          <p className="mini">
            Advertencia: el espacio de mensajes tiene{" "}
            <Latex expr={`2^{${data.k}}=${data.totalMessages}`} /> elementos.
            Para mantener la página estable, se muestran los primeros{" "}
            <Latex expr={`${MAX_MESSAGES}`} /> mensajes.
          </p>
        )}

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