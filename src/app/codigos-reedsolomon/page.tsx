"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";

const mod = (a: number, p: number) => ((a % p) + p) % p;

function parseNums(s: string) {
  return s
    .split(/[;,\s]+/)
    .map((x) => parseInt(x.trim()))
    .filter((x) => !Number.isNaN(x));
}

function vectors(q: number, k: number) {
  const out: number[][] = [];
  const total = q ** k;

  for (let idx = 0; idx < total; idx++) {
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

    while (M[i][lead] === 0) {
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

function isPrime(n: number) {
  if (n < 2) return false;

  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }

  return true;
}

function evalP(c: number[], x: number, p: number) {
  let s = 0;
  let pw = 1;

  for (const a of c) {
    s = mod(s + a * pw, p);
    pw = mod(pw * x, p);
  }

  return s;
}

function vand(k: number, A: number[], p: number) {
  return Array.from({ length: k }, (_, i) => A.map((a) => mod(a ** i, p)));
}

function normalizeEvaluationPoints(text: string, n: number, p: number) {
  const parsed = parseNums(text).map((x) => mod(x, p));
  const A: number[] = [];

  for (const value of parsed) {
    if (A.length >= n) break;
    A.push(value);
  }

  let candidate = 0;

  while (A.length < n) {
    A.push(mod(candidate, p));
    candidate++;
  }

  return A.slice(0, n);
}

function normalizeReceivedWord(text: string, n: number, p: number) {
  const parsed = parseNums(text).map((x) => mod(x, p));
  const y = [...parsed];

  while (y.length < n) {
    y.push(0);
  }

  return y.slice(0, n);
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

export default function Page() {
  const [p, setP] = useState(5);
  const [n, setN] = useState(5);
  const [k, setK] = useState(3);
  const [pts, setPts] = useState("0,1,2,3,4");
  const [y, setY] = useState("1,1,2,4,2");
  const [pp, setPp] = useState(5);
  const [sp, setSp] = useState(5);
  const [pm, setPm] = useState("2,1,3,4,5");

  const safeP = Math.max(p, 2);
  const safeN = Math.max(n, 1);
  const safeK = Math.max(k, 1);
  const totalMessages = safeP ** safeK;

  const rawA = parseNums(pts);
  const rawY = parseNums(y);

  const data = useMemo(() => {
    const A = normalizeEvaluationPoints(pts, safeN, safeP);
    const G = vand(safeK, A, safeP);
    const H = nullspace(G, safeP);

    const rows = vectors(safeP, safeK).map((u) => {
      const cw = A.map((a) => evalP(u, a, safeP));

      return {
        u,
        fx: poly(u),
        cw,
        peso: wgt(cw),
      };
    });

    const code = rows.map((r) => r.cw);

    return {
      A,
      G,
      H,
      rows,
      code,
      prime: isPrime(safeP),
      distinct: new Set(A).size === A.length,
      d: minD(code),
    };
  }, [safeP, safeN, safeK, pts]);

  const yy = normalizeReceivedWord(y, safeN, safeP);
  const syn = matVec(data.H, yy, safeP);

  const puncturePosition = clampPosition(pp, safeN);
  const shortenPosition = clampPosition(sp, safeN);

  const pun = puncture(data.code, puncturePosition - 1);
  const red = shorten(data.code, shortenPosition - 1);

  const parsedPerm = parsePermutation(pm, safeN);
  const eq = parsedPerm.valid ? permute(data.code, parsedPerm.indices) : [];

  const validPrime = data.prime;
  const validKRange = safeK >= 1 && safeK <= safeN;
  const validNRange = safeN >= 1 && safeN <= safeP;
  const validDistinctA = data.distinct;
  const validAQuantity = data.A.length === safeN;
  const validYQuantity = rawY.length === safeN;
  const validPermutation = parsedPerm.valid;

  const isReedSolomon =
    validPrime &&
    validKRange &&
    validNRange &&
    validDistinctA &&
    validAQuantity;

  const validationMessages = [
    !validPrime
      ? `Se recomienda corregir p: el valor ${safeP} no es primo. Para Reed–Solomon estándar, p debe ser primo.`
      : null,
    !validKRange
      ? `Se recomienda corregir k: debe cumplirse 1 ≤ k ≤ n. Actualmente k=${safeK} y n=${safeN}.`
      : null,
    !validNRange
      ? `Se recomienda corregir n o p: para Reed–Solomon estándar debe cumplirse n ≤ p. Actualmente n=${safeN} y p=${safeP}.`
      : null,
    !validDistinctA
      ? "Se recomienda corregir A: los puntos de evaluación deben ser distintos."
      : null,
    rawA.length < safeN
      ? `Se recomienda completar A: se escribieron ${rawA.length} puntos y se necesitan ${safeN}. La aplicación completó los faltantes automáticamente.`
      : null,
    rawA.length > safeN
      ? `Observación: se escribieron ${rawA.length} puntos en A, pero solo se usan los primeros ${safeN}.`
      : null,
    !validYQuantity
      ? `Se recomienda corregir y: la palabra recibida debe tener longitud ${safeN}. Actualmente tiene ${rawY.length} coordenadas; la aplicación completa o recorta para calcular el síndrome.`
      : null,
    !validPermutation
      ? `Se recomienda corregir la permutación: debe contener exactamente los números del 1 al ${safeN}, sin repetir.`
      : null,
  ].filter(Boolean);

  return (
    <main className="container">
      <Nav />

      <section className="hero">
        <span className="badge">Códigos Reed–Solomon dinámicos</span>

        <h1 className="title">Simulador de códigos Reed–Solomon</h1>

        <p className="subtitle">
          Esta sección dinámica permite construir códigos Reed–Solomon
          modificando parámetros como el cuerpo finito{" "}
          <Latex expr={"\\mathbb{F}_p"} />, la longitud <Latex expr={"n"} />, la
          dimensión <Latex expr={"k"} /> y el conjunto de evaluación{" "}
          <Latex expr={"A"} />. Con estos datos, el sistema genera
          automáticamente la matriz de Vandermonde, las palabras código, la
          matriz de control, el síndrome y la distancia mínima.
        </p>
      </section>

      <section className="section card">
        <h2>1. Parámetros</h2>

        <div className="control-grid">
          <div>
            <label>p</label>
            <input
              type="number"
              value={p}
              onChange={(e) => setP(+e.target.value || 2)}
            />
          </div>

          <div>
            <label>n</label>
            <input
              type="number"
              value={n}
              onChange={(e) => setN(+e.target.value || 1)}
            />
          </div>

          <div>
            <label>k</label>
            <input
              type="number"
              value={k}
              onChange={(e) => setK(+e.target.value || 1)}
            />
          </div>

          <div>
            <label>A</label>
            <input value={pts} onChange={(e) => setPts(e.target.value)} />
          </div>

          <div>
            <label>y</label>
            <input value={y} onChange={(e) => setY(e.target.value)} />
          </div>
        </div>

        <div className="algo-box">
          <h3>¿Qué significa cada parámetro?</h3>

          <ul>
            <li>
              <strong>
                <Latex expr={"p"} />:
              </strong>{" "}
              tamaño del cuerpo finito <Latex expr={"\\mathbb{F}_p"} />. Para
              Reed–Solomon estándar se recomienda que <Latex expr={"p"} /> sea
              primo.
            </li>

            <li>
              <strong>
                <Latex expr={"n"} />:
              </strong>{" "}
              longitud del código. Representa la cantidad de coordenadas de cada
              palabra código y coincide con el número de puntos de evaluación.
            </li>

            <li>
              <strong>
                <Latex expr={"k"} />:
              </strong>{" "}
              dimensión del código. Cada mensaje tiene <Latex expr={"k"} />{" "}
              coordenadas y se interpreta como un polinomio de grado menor que{" "}
              <Latex expr={"k"} />.
            </li>

            <li>
              <strong>
                <Latex expr={"A"} />:
              </strong>{" "}
              conjunto de puntos de evaluación. Para Reed–Solomon estándar, los
              puntos de <Latex expr={"A"} /> deben ser distintos.
            </li>

            <li>
              <strong>
                <Latex expr={"y"} />:
              </strong>{" "}
              palabra recibida. Con ella se calcula el síndrome{" "}
              <Latex expr={"s=Hy^t"} /> para revisar si pertenece al código.
            </li>
          </ul>
        </div>

        <span className={validPrime ? "pill ok" : "pill warn"}>
          {validPrime ? "p primo" : "Corregir p: no es primo"}
        </span>

        <span className={validKRange ? "pill ok" : "pill warn"}>
          {validKRange ? "1 ≤ k ≤ n" : "Corregir k: debe cumplirse k ≤ n"}
        </span>

        <span className={validNRange ? "pill ok" : "pill warn"}>
          {validNRange ? "n ≤ p" : "Corregir n o p: debe cumplirse n ≤ p"}
        </span>

        <span className={validDistinctA ? "pill ok" : "pill warn"}>
          {validDistinctA ? "A sin repetidos" : "Corregir A: puntos repetidos"}
        </span>

        <span className={validYQuantity ? "pill ok" : "pill warn"}>
          {validYQuantity
            ? "y tiene longitud correcta"
            : "Revisar y: longitud distinta de n"}
        </span>

        <span className={validPermutation ? "pill ok" : "pill warn"}>
          {validPermutation
            ? "Permutación válida"
            : "Revisar permutación equivalente"}
        </span>

        <span className={isReedSolomon ? "pill ok" : "pill warn"}>
          {isReedSolomon
            ? "Sí es un código Reed–Solomon estándar"
            : "No es Reed–Solomon estándar con estos parámetros"}
        </span>

        <span className="pill">
          Mensajes generados: {data.rows.length} de {totalMessages}
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
      </section>

      <section className="section two">
        <div className="card">
          <h2>2. Definición</h2>

          <Latex
            block
            expr={`C(A)=\\{(f(a_1),\\ldots,f(a_${safeN})):f\\in\\mathbb{F}_${safeP}[x],\\ \\deg(f)<${safeK}\\}`}
          />

          <Latex block expr={`A=\\{${data.A.join(",")}\\}`} />

          <p className="text">
            La longitud efectiva del código es <Latex expr={`n=${safeN}`} />,
            porque se están usando <Latex expr={`${safeN}`} /> puntos de
            evaluación.
          </p>

          <p className="mini">
            Si el usuario escribe más puntos de los necesarios en{" "}
            <Latex expr={"A"} />, solo se toman los primeros{" "}
            <Latex expr={`${safeN}`} />. Si escribe menos, la aplicación
            completa automáticamente los faltantes para poder construir la
            matriz.
          </p>
        </div>

        <div className="card">
          <h2>3. Validación</h2>

          <Latex
            block
            expr={`[n,k,d]\\approx[${safeN},${safeK},${
              data.d
            }]_${safeP},\\quad d_{RS}=n-k+1=${safeN - safeK + 1}`}
          />

          <p className="text">
            Para que la configuración corresponda a un código Reed–Solomon
            estándar, se recomienda cumplir{" "}
            <Latex expr={"1\\leq k\\leq n\\leq p"} /> y usar puntos de
            evaluación distintos.
          </p>

          <p className={isReedSolomon ? "text ok" : "text warn"}>
            {isReedSolomon
              ? "La configuración ingresada cumple las condiciones básicas de un código Reed–Solomon estándar."
              : "La configuración ingresada no cumple todas las condiciones básicas de un código Reed–Solomon estándar. Revise las recomendaciones anteriores."}
          </p>

          <span className={isReedSolomon ? "pill ok" : "pill warn"}>
            {isReedSolomon
              ? "Sí es Reed–Solomon estándar"
              : "No es Reed–Solomon estándar"}
          </span>
        </div>
      </section>

      <section className="section card">
        <h2>4. Matriz generadora Vandermonde</h2>

        <MatrixLatex name="G" matrix={data.G} />

        <div className="algo-box">
          <ol>
            <li>
              Tomar el cuerpo <Latex expr={"\\mathbb{F}_p"} />.
            </li>
            <li>
              Tomar el conjunto de evaluación <Latex expr={"A"} />.
            </li>
            <li>
              Construir la matriz <Latex expr={"G"} /> usando potencias de los
              elementos de <Latex expr={"A"} />.
            </li>
            <li>
              Cada fila de <Latex expr={"G"} /> corresponde a una potencia:
              <Latex expr={"1,x,x^2,\\ldots,x^{k-1}"} />.
            </li>
            <li>
              Codificar cada mensaje mediante <Latex expr={"uG"} /> y reducir
              cada coordenada módulo <Latex expr={"p"} />.
            </li>
          </ol>
        </div>

        <p className="mini">
          Si <Latex expr={"A"} /> tiene puntos repetidos, la matriz de
          Vandermonde puede perder las propiedades esperadas para un código
          Reed–Solomon.
        </p>
      </section>

      <section className="section card">
        <h2>5. Matriz de control y síndrome</h2>

        <MatrixLatex name="H" matrix={data.H} />

        <Latex block expr={`y=(${yy.join(",")})`} />
        <Latex block expr={`s=Hy^t=(${syn.join(",")})`} />

        <span className={syn.every((x) => x === 0) ? "pill ok" : "pill warn"}>
          {syn.every((x) => x === 0)
            ? "Síndrome cero: y pertenece al código"
            : "Síndrome no cero: y no pertenece al código o contiene error"}
        </span>

        <p className="mini">
          El síndrome <Latex expr={"s=Hy^t"} /> permite verificar si la palabra
          recibida <Latex expr={"y"} /> satisface la condición de pertenencia al
          código. Si el síndrome es cero, la palabra es compatible con la matriz
          de control.
        </p>
      </section>

      <section className="section three">
        <div className="card">
          <h2>6. Perforación</h2>

          <label>Coordenada</label>

          <input
            type="number"
            value={pp}
            min={1}
            max={safeN}
            onChange={(e) => setPp(+e.target.value || 1)}
          />

          <span className="pill">{pun.length} palabras</span>

          <p className="mini">
            Se elimina la coordenada <Latex expr={`i=${puncturePosition}`} /> de
            todas las palabras código.
          </p>

          <span
            className={
              puncturePosition >= 1 && puncturePosition <= safeN
                ? "pill ok"
                : "pill warn"
            }
          >
            {puncturePosition >= 1 && puncturePosition <= safeN
              ? "Coordenada válida"
              : "Revisar coordenada"}
          </span>
        </div>

        <div className="card">
          <h2>7. Reducción</h2>

          <label>Coordenada</label>

          <input
            type="number"
            value={sp}
            min={1}
            max={safeN}
            onChange={(e) => setSp(+e.target.value || 1)}
          />

          <span className="pill">{red.length} palabras</span>

          <p className="mini">
            Se conservan únicamente las palabras cuya coordenada{" "}
            <Latex expr={`i=${shortenPosition}`} /> es igual a cero y luego se
            elimina esa coordenada.
          </p>

          <span
            className={
              shortenPosition >= 1 && shortenPosition <= safeN
                ? "pill ok"
                : "pill warn"
            }
          >
            {shortenPosition >= 1 && shortenPosition <= safeN
              ? "Coordenada válida"
              : "Revisar coordenada"}
          </span>
        </div>

        <div className="card">
          <h2>8. Equivalente</h2>

          <label>Permutación</label>

          <input value={pm} onChange={(e) => setPm(e.target.value)} />

          <span className={validPermutation ? "pill ok" : "pill warn"}>
            {validPermutation
              ? `${eq.length} palabras`
              : "Permutación inválida"}
          </span>

          <p className="mini">
            La permutación debe contener exactamente los números del{" "}
            <Latex expr={"1"} /> al <Latex expr={`${safeN}`} />, sin repetir.
          </p>

          <p className="mini">
            Esta operación reordena las coordenadas de las palabras código y
            genera un código equivalente.
          </p>
        </div>
      </section>

      <section className="section card">
        <h2>9. Mensajes, polinomios y productos uG</h2>

        <p className="text">
          En esta tabla se muestran todos los mensajes generados, el polinomio
          asociado a cada mensaje, la palabra código obtenida mediante
          evaluación y su peso de Hamming.
        </p>

        <p className="mini">
          Se muestran todos los mensajes generados para la configuración actual.
          El total esperado es{" "}
          <Latex expr={`${safeP}^${safeK}=${totalMessages}`} />.
        </p>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>u</th>
                <th>f_u(x)</th>
                <th>uG</th>
                <th>Peso</th>
              </tr>
            </thead>

            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="mono">({r.u.join(",")})</td>
                  <td className="mono">{r.fx}</td>
                  <td className="mono">({r.cw.join(",")})</td>
                  <td>{r.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.rows.length > 500 && (
          <p className="mini">
            Advertencia: esta configuración genera una tabla grande. Aunque se
            muestran todos los mensajes, puede ser más cómodo usar valores
            pequeños de <Latex expr={"p"} /> y <Latex expr={"k"} /> para revisar
            los resultados visualmente.
          </p>
        )}
      </section>

      <Footer />
    </main>
  );
}
