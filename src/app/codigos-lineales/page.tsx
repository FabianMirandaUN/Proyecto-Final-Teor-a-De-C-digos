"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { CodeSet } from "@/components/Tables";

const MAX_MESSAGES = 5000;

const mod = (a: number, p: number) => ((a % p) + p) % p;

function isPrime(n: number) {
  if (n < 2) return false;

  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }

  return true;
}

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

function mv(v: number[], M: number[][], q: number) {
  return Array.from({ length: M[0]?.length || 0 }, (_, j) =>
    mod(
      v.reduce((s, x, i) => s + x * (M[i]?.[j] ?? 0), 0),
      q
    )
  );
}

function inv(a: number, q: number) {
  a = mod(a, q);

  for (let x = 1; x < q; x++) {
    if (mod(a * x, q) === 1) return x;
  }

  return 0;
}

function rref(A: number[][], q: number) {
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

    const iv = inv(M[r][lead], q);

    if (iv) {
      M[r] = M[r].map((x) => mod(x * iv, q));
    }

    for (let i2 = 0; i2 < M.length; i2++) {
      const f = M[i2][lead];

      if (i2 !== r && f !== 0) {
        M[i2] = M[i2].map((x, j) => mod(x - f * M[r][j], q));
      }
    }

    pivots.push(lead);
    lead++;
  }

  return { M, pivots };
}

function nullspace(A: number[][], q: number) {
  if (!A.length) return [];

  const { M, pivots } = rref(A, q);
  const cols = A[0].length;
  const free: number[] = [];

  for (let j = 0; j < cols; j++) {
    if (!pivots.includes(j)) free.push(j);
  }

  return free.map((f) => {
    const v = Array(cols).fill(0);
    v[f] = 1;

    pivots.forEach((pc, i) => {
      v[pc] = mod(-M[i][f], q);
    });

    return v;
  });
}

function matVec(M: number[][], v: number[], q: number) {
  return M.map((r) =>
    mod(
      r.reduce((s, x, i) => s + x * (v[i] || 0), 0),
      q
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

function parseMatrixRows(s: string) {
  return s
    .trim()
    .split("\n")
    .map((r) => parseNums(r))
    .filter((r) => r.length);
}

function parseMatrix(s: string, q: number) {
  return parseMatrixRows(s).map((r) => r.map((x) => mod(x, q)));
}

function isRectangular(M: number[][]) {
  if (!M.length) return false;
  const n = M[0].length;
  return n > 0 && M.every((row) => row.length === n);
}

function normalizeWord(text: string, n: number, q: number) {
  const parsed = parseNums(text).map((x) => mod(x, q));
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

function parsePermutation(text: string, n: number) {
  const values = parseNums(text);

  const valid =
    values.length === n &&
    new Set(values).size === n &&
    values.every((x) => x >= 1 && x <= n);

  if (!valid) {
    return {
      valid: false,
      indices: Array.from({ length: n }, (_, i) => i),
    };
  }

  return {
    valid: true,
    indices: values.map((x) => x - 1),
  };
}

function describeAffectedColumns(indices: number[]) {
  const affected = indices
    .map((value, position) => ({
      newPosition: position + 1,
      oldPosition: value + 1,
    }))
    .filter((item) => item.newPosition !== item.oldPosition);

  if (affected.length === 0) {
    return "La permutación no modifica el orden de las columnas.";
  }

  return affected
    .map(
      (item) =>
        `La nueva columna ${item.newPosition} toma la columna original ${item.oldPosition}`
    )
    .join("; ");
}

export default function Page() {
  const [q, setQ] = useState(2);

  const [g, setG] = useState(
    "1 1 1 0 0 0 0\n1 0 0 1 1 0 0\n1 0 0 0 0 1 1\n0 1 0 1 0 1 0"
  );

  const [y, setY] = useState("1,0,1,0,1,0,1");
  const [pp, setPp] = useState(7);
  const [sp, setSp] = useState(7);
  const [perm, setPerm] = useState("2,1,3,4,5,6,7");

  const safeQ = Math.max(q, 2);
  const rawG = parseMatrixRows(g);
  const rawY = parseNums(y);

  const data = useMemo(() => {
    const G = parseMatrix(g, safeQ);
    const rectangular = isRectangular(G);
    const n = rectangular ? G[0].length : 0;
    const k = G.length;
    const totalMessages = rectangular ? safeQ ** k : 0;
    const completeGeneration = totalMessages <= MAX_MESSAGES;

    const reduced = rectangular ? rref(G, safeQ) : { M: [], pivots: [] };
    const rank = rectangular && isPrime(safeQ) ? reduced.pivots.length : 0;

    const rows = rectangular
      ? vectors(safeQ, k).map((u) => {
          const cw = mv(u, G, safeQ);
          return { u, cw, peso: wgt(cw) };
        })
      : [];

    const code = rectangular ? uniq(rows.map((r) => r.cw)) : [];
    const H = rectangular ? nullspace(G, safeQ) : [];

    return {
      G,
      rows,
      code,
      H,
      d: completeGeneration ? minD(code) : minD(code),
      n,
      k,
      rank,
      totalMessages,
      completeGeneration,
      rectangular,
      isField: isPrime(safeQ),
      reduced,
    };
  }, [g, safeQ]);

  const yy = normalizeWord(y, data.n, safeQ);
  const syn = matVec(data.H, yy, safeQ);

  const puncturePosition = clampPosition(pp, data.n);
  const reductionPosition = clampPosition(sp, data.n);

  const pun = data.rectangular ? puncture(data.code, puncturePosition - 1) : [];
  const red = data.rectangular ? shorten(data.code, reductionPosition - 1) : [];

  const parsedPerm = parsePermutation(perm, data.n);
  const eq =
    data.rectangular && parsedPerm.valid
      ? permute(data.code, parsedPerm.indices)
      : [];

  const validMatrix = data.rectangular && data.n > 0 && data.k > 0;
  const validField = data.isField;
  const validRank = validField && data.rank === data.k;
  const validYLength = rawY.length === data.n;
  const validPuncture = pp >= 1 && pp <= data.n;
  const validReduction = sp >= 1 && sp <= data.n;
  const validPermutation = parsedPerm.valid;

  const isLinearCodeStandard = validField && validMatrix;

  const validationMessages = [
    !validField
      ? `Se recomienda corregir q: el valor ${safeQ} no es primo. Para trabajar formalmente sobre un cuerpo finito, q debe ser primo.`
      : null,
    !validMatrix
      ? "Se recomienda corregir G: la matriz generadora debe ser rectangular, no vacía y con todas las filas de la misma longitud."
      : null,
    validMatrix && !validRank
      ? `Advertencia: las filas de G pueden ser dependientes. El número de filas es k=${data.k}, pero el rango estimado es ${data.rank}. La dimensión real del código puede ser menor que k.`
      : null,
    !validYLength
      ? `Se recomienda corregir y: la palabra recibida debe tener longitud n=${data.n}. Actualmente tiene ${rawY.length} coordenadas; la aplicación completa o recorta para calcular el síndrome.`
      : null,
    !validPuncture
      ? `Se recomienda corregir la coordenada de perforación: debe estar entre 1 y ${data.n}.`
      : null,
    !validReduction
      ? `Se recomienda corregir la coordenada de reducción: debe estar entre 1 y ${data.n}.`
      : null,
    !validPermutation
      ? `Se recomienda corregir la permutación: debe contener exactamente los números del 1 al ${data.n}, sin repetir.`
      : null,
    !data.completeGeneration
      ? `Advertencia: el espacio de mensajes tiene ${data.totalMessages} elementos. Para mantener la página estable, se generan los primeros ${MAX_MESSAGES}.`
      : null,
  ].filter(Boolean);

  return (
    <main className="container">
      <Nav />

      <section className="hero">
        <span className="badge">Códigos lineales dinámicos</span>

        <h1 className="title">
          Simulador de códigos lineales sobre cuerpos finitos
        </h1>

        <p className="subtitle">
          Esta sección permite construir códigos lineales sobre cuerpos finitos
          a partir de una matriz generadora editable <Latex expr={"G"} />. El
          usuario puede modificar el valor de <Latex expr={"q"} />, generar el
          código <Latex expr={"C=\\{uG:u\\in\\mathbb{F}_q^k\\}"} />, calcular la
          matriz de control <Latex expr={"H"} />, obtener síndromes y aplicar
          operaciones como equivalencia, extensión, perforación y reducción.
        </p>
      </section>

      <section className="section two">
        <div className="card">
          <h2>1. Espacio finito de trabajo</h2>

          <label>Valor de q para trabajar sobre Fq</label>

          <input
            type="number"
            value={q}
            onChange={(e) => setQ(+e.target.value || 2)}
          />

          <p className="text">
            El parámetro <Latex expr={"q"} /> define el conjunto de escalares
            usado en el código. Cuando <Latex expr={"q"} /> es primo, se trabaja
            formalmente sobre el cuerpo finito{" "}
            <Latex expr={"\\mathbb{F}_q"} />. Si <Latex expr={"q"} /> no es
            primo, la interfaz realiza operaciones módulo <Latex expr={"q"} />,
            pero algunos elementos podrían no tener inverso multiplicativo.
          </p>

          <span className={validField ? "pill ok" : "pill warn"}>
            {validField
              ? `F${safeQ} es un cuerpo finito primo`
              : `Z${safeQ} no es un cuerpo finito primo`}
          </span>

          <span className={isLinearCodeStandard ? "pill ok" : "pill warn"}>
            {isLinearCodeStandard
              ? "Sí es un código lineal sobre cuerpo finito"
              : "No es un código lineal estándar sobre cuerpo finito"}
          </span>

          <Latex block expr={`K=\\mathbb{F}_{${safeQ}}`} />

          <div className="algo-box">
            <h3>¿Qué significa cada parámetro?</h3>

            <ul>
              <li>
                <strong>
                  <Latex expr={"q"} />:
                </strong>{" "}
                tamaño del cuerpo finito <Latex expr={"\\mathbb{F}_q"} />.
                Para que sea un cuerpo primo, <Latex expr={"q"} /> debe ser
                primo.
              </li>

              <li>
                <strong>
                  <Latex expr={"G"} />:
                </strong>{" "}
                matriz generadora. Sus filas generan el código lineal.
              </li>

              <li>
                <strong>
                  <Latex expr={"k"} />:
                </strong>{" "}
                número de filas de <Latex expr={"G"} />. Representa la cantidad
                de coordenadas del mensaje antes de considerar dependencias.
              </li>

              <li>
                <strong>
                  <Latex expr={"n"} />:
                </strong>{" "}
                número de columnas de <Latex expr={"G"} />. Representa la
                longitud de cada palabra código.
              </li>

              <li>
                <strong>
                  <Latex expr={"y"} />:
                </strong>{" "}
                palabra recibida. Se usa para calcular el síndrome{" "}
                <Latex expr={"s=Hy^t"} />.
              </li>
            </ul>
          </div>

          <div className="algo-box">
            <h3>Validaciones y recomendaciones</h3>

            <span className={validField ? "pill ok" : "pill warn"}>
              {validField ? "q primo" : "Corregir q: no es primo"}
            </span>

            <span className={validMatrix ? "pill ok" : "pill warn"}>
              {validMatrix
                ? "Matriz G rectangular"
                : "Corregir G: matriz no rectangular"}
            </span>

            <span className={validRank ? "pill ok" : "pill warn"}>
              {validRank
                ? "Filas independientes"
                : "Revisar rango: puede haber dependencia"}
            </span>

            <span className={validYLength ? "pill ok" : "pill warn"}>
              {validYLength
                ? "y tiene longitud n"
                : "Revisar y: longitud distinta de n"}
            </span>

            <span className={validPuncture ? "pill ok" : "pill warn"}>
              {validPuncture
                ? "Perforación válida"
                : "Revisar coordenada de perforación"}
            </span>

            <span className={validReduction ? "pill ok" : "pill warn"}>
              {validReduction
                ? "Reducción válida"
                : "Revisar coordenada de reducción"}
            </span>

            <span className={validPermutation ? "pill ok" : "pill warn"}>
              {validPermutation
                ? "Permutación válida"
                : "Revisar permutación"}
            </span>

            <span className="pill">
              Mensajes generados: {data.rows.length} de {data.totalMessages}
            </span>

            {validationMessages.length > 0 && (
              <ul>
                {validationMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <h2>2. Matriz generadora editable</h2>

          <label>Matriz G por filas</label>

          <textarea rows={6} value={g} onChange={(e) => setG(e.target.value)} />

          <p className="text">
            Cada fila de <Latex expr={"G"} /> representa un vector generador. Si{" "}
            <Latex expr={"G"} /> tiene <Latex expr={"k"} /> filas y{" "}
            <Latex expr={"n"} /> columnas, entonces genera un código de longitud{" "}
            <Latex expr={"n"} /> y dimensión a lo sumo <Latex expr={"k"} />.
          </p>

          {validMatrix ? (
            <MatrixLatex name="G" matrix={data.G} />
          ) : (
            <span className="pill warn">
              La matriz no puede mostrarse correctamente porque no es
              rectangular.
            </span>
          )}

          {validMatrix && (
            <>
              <Latex
                block
                expr={`G\\in\\mathbb{F}_{${safeQ}}^{${data.k}\\times ${data.n}}`}
              />

              <Latex
                block
                expr={`\\operatorname{rank}(G)\\approx ${data.rank}`}
              />
            </>
          )}
        </div>
      </section>

      <section className="section two">
        <div className="card">
          <h2>3. Parámetros del código</h2>

          <Latex
            block
            expr={`[n,k,d]\\approx[${data.n},${data.rank || data.k},${data.d}]_{${safeQ}}`}
          />

          <Latex
            block
            expr={`C=\\{uG:u\\in\\mathbb{F}_{${safeQ}}^{${data.k}}\\}`}
          />

          <Latex block expr={`C\\subseteq\\mathbb{F}_{${safeQ}}^{${data.n}}`} />

          <Latex
            block
            expr={`T:\\mathbb{F}_{${safeQ}}^{${data.k}}\\longrightarrow\\mathbb{F}_{${safeQ}}^{${data.n}},\\quad T(u)=uG`}
          />

          <p className="text">
            La longitud <Latex expr={"n"} /> corresponde al número de columnas
            de <Latex expr={"G"} />. El número de filas es{" "}
            <Latex expr={"k"} />, pero si las filas son dependientes, la
            dimensión real del código es el rango de <Latex expr={"G"} />.
          </p>
        </div>

        <div className="card">
          <h2>4. Matriz de control y síndrome</h2>

          <MatrixLatex name="H" matrix={data.H} />

          <label>Palabra recibida y</label>

          <input value={y} onChange={(e) => setY(e.target.value)} />

          <Latex block expr={`y=(${yy.join(",")})`} />
          <Latex block expr={`s=Hy^t=(${syn.join(",")})`} />

          <span className={syn.every((x) => x === 0) ? "pill ok" : "pill warn"}>
            {syn.every((x) => x === 0)
              ? "Síndrome cero: y pertenece al código"
              : "Síndrome no cero: y no pertenece al código o contiene error"}
          </span>

          <p className="text">
            La matriz <Latex expr={"H"} /> se calcula como una base del núcleo de{" "}
            <Latex expr={"G"} />. Una palabra <Latex expr={"y"} /> pertenece al
            código si y solo si su síndrome es cero.
          </p>

          <Latex block expr={`y\\in C\\Longleftrightarrow Hy^t=0`} />
        </div>
      </section>

      <section className="section card">
        <h2>5. Algoritmo de generación del código</h2>

        <div className="algo-box">
          <ol>
            <li>
              Seleccionar <Latex expr={"q"} /> para trabajar sobre{" "}
              <Latex expr={"\\mathbb{F}_q"} />.
            </li>
            <li>
              Leer la matriz generadora <Latex expr={"G"} /> escrita por el
              usuario.
            </li>
            <li>
              Verificar que <Latex expr={"G"} /> sea rectangular y tenga entradas
              válidas módulo <Latex expr={"q"} />.
            </li>
            <li>
              Generar los mensajes <Latex expr={"u\\in\\mathbb{F}_q^k"} />.
            </li>
            <li>
              Calcular <Latex expr={"uG"} /> para cada mensaje.
            </li>
            <li>
              Eliminar duplicados si las filas de <Latex expr={"G"} /> son
              dependientes.
            </li>
            <li>
              Calcular pesos, distancia mínima y matriz de control.
            </li>
          </ol>
        </div>

        <CodeSet label="C" codewords={data.code} />
      </section>

      <section className="section three">
        <div className="card">
          <h2>6. Perforación</h2>

          <p className="text">
            La perforación elimina una coordenada fija de todas las palabras del
            código.
          </p>

          <label>Coordenada a eliminar</label>

          <input
            type="number"
            value={pp}
            min={1}
            max={data.n}
            onChange={(e) => setPp(+e.target.value || 1)}
          />

          <Latex
            block
            expr={`\\mathring{C}(${puncturePosition})=\\{\\text{palabras de }C\\text{ sin la coordenada }${puncturePosition}\\}`}
          />

          <CodeSet label={`\\mathring{C}(${puncturePosition})`} codewords={pun} />
        </div>

        <div className="card">
          <h2>7. Reducción</h2>

          <p className="text">
            La reducción conserva solamente las palabras cuya coordenada
            seleccionada es cero y luego elimina esa coordenada.
          </p>

          <label>Coordenada de reducción</label>

          <input
            type="number"
            value={sp}
            min={1}
            max={data.n}
            onChange={(e) => setSp(+e.target.value || 1)}
          />

          <Latex
            block
            expr={`\\breve{C}(${reductionPosition})=\\{c\\in C:c_{${reductionPosition}}=0\\text{, eliminando esa coordenada}\\}`}
          />

          <CodeSet label={`\\breve{C}(${reductionPosition})`} codewords={red} />
        </div>

        <div className="card">
          <h2>8. Código equivalente</h2>

          <p className="text">
            Un código equivalente se obtiene aplicando una permutación de
            coordenadas. Esta operación conserva la distancia de Hamming.
          </p>

          <label>Permutación de coordenadas</label>

          <input value={perm} onChange={(e) => setPerm(e.target.value)} />

          <Latex block expr={`C_{eq}=\\pi(C)`} />

          <p className="mini">{describeAffectedColumns(parsedPerm.indices)}.</p>

          <CodeSet label="C_{eq}" codewords={eq} />
        </div>
      </section>

      <section className="section card">
        <h2>9. Tabla de mensajes y productos uG</h2>

        <p className="text">
          Esta tabla muestra la correspondencia entre cada mensaje{" "}
          <Latex expr={"u"} /> y su palabra código <Latex expr={"uG"} />.
        </p>

        {!data.completeGeneration && (
          <p className="mini">
            Advertencia: el espacio de mensajes tiene{" "}
            <Latex expr={`${safeQ}^{${data.k}}=${data.totalMessages}`} />{" "}
            elementos. Para mantener la página estable, se muestran los primeros{" "}
            <Latex expr={`${MAX_MESSAGES}`} /> mensajes.
          </p>
        )}

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mensaje u</th>
                <th>Producto uG</th>
                <th>Peso</th>
              </tr>
            </thead>

            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="mono">({r.u.join(",")})</td>
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