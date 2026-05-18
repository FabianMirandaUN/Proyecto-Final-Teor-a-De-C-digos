"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { CodeSet } from "@/components/Tables";

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

  for (let i = 0; i < Math.min(code.length, 300); i++) {
    for (let j = i + 1; j < Math.min(code.length, 300); j++) {
      m = Math.min(m, dist(code[i], code[j]));
    }
  }

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

function mv(v: number[], M: number[][], q: number) {
  return Array.from({ length: M[0]?.length || 0 }, (_, j) =>
    mod(
      v.reduce((s, x, i) => s + x * M[i][j], 0),
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
    code
      .filter((c) => c[pos] === 0)
      .map((c) => c.filter((_, i) => i !== pos))
  );
}

function permute(code: number[][], perm: number[]) {
  return code.map((c) => perm.map((i) => c[i] ?? 0));
}

function parseMatrix(s: string, q: number) {
  return s
    .trim()
    .split("\n")
    .map((r) => parseNums(r).map((x) => mod(x, q)))
    .filter((r) => r.length);
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

  const data = useMemo(() => {
    const G = parseMatrix(g, q);

    const rows = vectors(q, G.length).map((u) => {
      const cw = mv(u, G, q);
      return { u, cw, peso: wgt(cw) };
    });

    const code = uniq(rows.map((r) => r.cw));
    const H = nullspace(G, q);

    return {
      G,
      rows,
      code,
      H,
      d: minD(code),
      n: G[0]?.length || 0,
      k: G.length,
      isField: isPrime(q),
    };
  }, [g, q]);

  const yy = parseNums(y)
    .slice(0, data.n)
    .map((x) => mod(x, q));

  const syn = matVec(data.H, yy, q);

  const pun = puncture(data.code, pp - 1);
  const red = shorten(data.code, sp - 1);

  const prm = parseNums(perm).map((x) => x - 1);

  const eq = prm.length === data.n ? permute(data.code, prm) : [];

  return (
    <main className="container">
      <Nav />

      <section className="hero">
        <span className="badge">Códigos lineales dinámicos</span>

        <h1 className="title">
          Simulador de códigos lineales sobre cuerpos finitos
        </h1>

        <p className="subtitle">
          Esta sección permite definir el espacio algebraico de trabajo,
          construir códigos lineales a partir de una matriz generadora editable,
          calcular la matriz de control, obtener síndromes y aplicar operaciones
          como perforación, reducción y equivalencia de códigos.
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
            El parámetro q define el conjunto de escalares usado en el código.
            Cuando q es primo, se trabaja formalmente sobre el cuerpo finito
            Fq. Si q no es primo, la interfaz realiza operaciones módulo q,
            pero algunos elementos podrían no tener inverso multiplicativo.
          </p>

          <span className={data.isField ? "pill ok" : "pill warn"}>
            {data.isField
              ? `F${q} es un cuerpo finito primo`
              : `Z${q} no es un cuerpo finito primo`}
          </span>

          <Latex block expr={`K=\\mathbb{F}_{${q}}`} />

          <div className="algo-box">
            <h3>Representación explícita del espacio</h3>

            <Latex
              block
              expr={`\\mathbb{F}_{${q}}=\\{0,1,\\ldots,${q - 1}\\}`}
            />

            <Latex
              block
              expr={`\\mathbb{F}_{${q}}^{${data.n}}=\\{(x_1,x_2,\\ldots,x_{${data.n}}):x_i\\in\\mathbb{F}_{${q}}\\}`}
            />

            <p className="text">
              El código generado por la matriz G vive dentro del espacio
              vectorial Fq^n. Esto significa que cada palabra código tiene n
              coordenadas y cada una de esas coordenadas pertenece al conjunto
              Fq.
            </p>
          </div>
        </div>

        <div className="card">
          <h2>2. Matriz generadora editable</h2>

          <label>Matriz G por filas</label>
          <textarea
            rows={6}
            value={g}
            onChange={(e) => setG(e.target.value)}
          />

          <p className="text">
            Cada fila de G representa un vector generador. Si G tiene k filas y
            n columnas, entonces G genera un código lineal de dimensión a lo
            sumo k y longitud n.
          </p>

          <MatrixLatex name="G" matrix={data.G} />
        </div>
      </section>

      <section className="section two">
        <div className="card">
          <h2>3. Parámetros del código</h2>

          <Latex
            block
            expr={`[n,k,d]\\approx[${data.n},${data.k},${data.d}]_{${q}}`}
          />

          <Latex
            block
            expr={`C=\\{uG:u\\in\\mathbb{F}_{${q}}^{${data.k}}\\}`}
          />

          <Latex block expr={`C\\subseteq\\mathbb{F}_{${q}}^{${data.n}}`} />

          <Latex
            block
            expr={`T:\\mathbb{F}_{${q}}^{${data.k}}\\longrightarrow\\mathbb{F}_{${q}}^{${data.n}},\\quad T(u)=uG`}
          />

          <p className="text">
            La longitud n corresponde al número de columnas de G. La dimensión k
            corresponde al número de filas de G. Por tanto, los mensajes
            pertenecen a Fq^k y las palabras código pertenecen a Fq^n.
          </p>

          <p className="text">
            La aplicación lineal T transforma cada mensaje u en una palabra
            código mediante el producto uG. El conjunto de todas esas imágenes
            constituye el código lineal generado por G.
          </p>
        </div>

        <div className="card">
          <h2>4. Matriz de control y síndrome</h2>

          <MatrixLatex name="H" matrix={data.H} />

          <label>Palabra recibida y</label>
          <input value={y} onChange={(e) => setY(e.target.value)} />

          <Latex block expr={`s=Hy^t=(${syn.join(",")})`} />

          <p className="text">
            La matriz H se calcula como una base del núcleo de G. Una palabra y
            pertenece al código si y solo si su síndrome es cero.
          </p>

          <Latex
            block
            expr={`y\\in C\\Longleftrightarrow Hy^t=0`}
          />
        </div>
      </section>

      <section className="section card">
        <h2>5. Algoritmo de generación del código</h2>

        <div className="algo-box">
          <ol>
            <li>
              Definir el espacio algebraico de trabajo, es decir, seleccionar
              q para trabajar sobre Fq.
            </li>
            <li>
              Leer la matriz generadora G escrita por el usuario.
            </li>
            <li>
              Reducir todas las entradas de G módulo q para garantizar que sus
              coordenadas pertenezcan a Fq.
            </li>
            <li>
              Identificar k como el número de filas de G y n como el número de
              columnas.
            </li>
            <li>
              Generar todos los mensajes posibles u∈Fq^k.
            </li>
            <li>
              Calcular el producto uG para cada mensaje.
            </li>
            <li>
              Reducir cada coordenada de uG módulo q.
            </li>
            <li>
              Guardar cada vector resultante como palabra código.
            </li>
            <li>
              Eliminar duplicados, en caso de que existan.
            </li>
            <li>
              Calcular el peso de Hamming de cada palabra.
            </li>
            <li>
              Calcular la distancia mínima comparando pares de palabras código.
            </li>
            <li>
              Calcular H como base del núcleo de G.
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
            código. Si se elimina la coordenada i, se obtiene un nuevo código de
            longitud n−1.
          </p>

          <label>Coordenada a eliminar</label>
          <input
            type="number"
            value={pp}
            onChange={(e) => setPp(+e.target.value || 1)}
          />

          <Latex
            block
            expr={`\\mathring{C}(${pp})=\\{(c_1,\\ldots,c_{${data.n - 1}}):c\\in C\\}`}
          />

          <CodeSet label="C_p" codewords={pun} />
        </div>

        <div className="card">
          <h2>7. Reducción</h2>

          <p className="text">
            La reducción primero conserva solamente las palabras cuya coordenada
            seleccionada es cero. Después elimina esa coordenada. Por eso la
            reducción puede producir menos palabras que la perforación.
          </p>

          <label>Coordenada de reducción</label>
          <input
            type="number"
            value={sp}
            onChange={(e) => setSp(+e.target.value || 1)}
          />

          <Latex
            block
            expr={`\\breve{C}(${sp})=\\{\\text{palabras de }C\\text{ con }c_{${sp}}=0\\text{, eliminando esa coordenada}\\}`}
          />

          <CodeSet label="C_r" codewords={red} />
        </div>

        <div className="card">
          <h2>8. Código equivalente</h2>

          <p className="text">
            Un código equivalente se obtiene aplicando una permutación de
            coordenadas. Esta operación conserva la distancia de Hamming porque
            no cambia los símbolos, solo su posición.
          </p>

          <label>Permutación de coordenadas</label>
          <input value={perm} onChange={(e) => setPerm(e.target.value)} />

          <Latex block expr={`C_{eq}=\\pi(C)`} />

          <CodeSet label="C_{eq}" codewords={eq} />
        </div>
      </section>

      <section className="section card">
        <h2>9. Tabla de mensajes y productos uG</h2>

        <p className="text">
          Esta tabla muestra la correspondencia entre cada mensaje u y su
          palabra código uG. Es la evidencia computacional principal de la
          construcción del código lineal.
        </p>

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