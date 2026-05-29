"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import {
  CodewordTable,
  CodeSet,
  StandardizationSteps,
  ProductTable,
} from "@/components/Tables";
import {
  LINEAR,
  generateLinearCode,
  permuteColumns,
  puncture,
  shortenReduction,
} from "@/lib/linearCodes";

function parsePermutation(text: string, n: number) {
  const values = text
    .split(/[,\s;]+/)
    .map((x) => parseInt(x.trim()))
    .filter((x) => !Number.isNaN(x));

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

function clampPosition(pos: number, n: number) {
  if (Number.isNaN(pos)) return 1;
  return Math.min(Math.max(pos, 1), n);
}

function describeAffectedColumns(indices: number[]) {
  const affected = indices
    .map((value, position) => ({
      newPosition: position + 1,
      oldPosition: value + 1,
    }))
    .filter((item) => item.newPosition !== item.oldPosition);

  if (affected.length === 0) {
    return {
      affected,
      text: "La permutación no modifica el orden de las columnas.",
    };
  }

  return {
    affected,
    text: affected
      .map(
        (item) =>
          `La nueva columna ${item.newPosition} toma la columna original ${item.oldPosition}`
      )
      .join("; "),
  };
}

function permutationToLatex(indices: number[]) {
  return `\\pi=(${indices.map((x) => x + 1).join(",")})`;
}

export default function Page() {
  const n = LINEAR.G[0]?.length ?? 7;

  const [permText, setPermText] = useState("2,1,3,4,5,6,7");
  const [puncturePosition, setPuncturePosition] = useState(7);
  const [reductionPosition, setReductionPosition] = useState(7);

  const permutationData = useMemo(() => {
    const parsed = parsePermutation(permText, n);
    const Geq = permuteColumns(LINEAR.G, parsed.indices);
    const codeEq = generateLinearCode(Geq, 2);
    const affectedColumns = describeAffectedColumns(parsed.indices);

    return {
      valid: parsed.valid,
      indices: parsed.indices,
      Geq,
      codeEq,
      affectedColumns,
      latexPermutation: permutationToLatex(parsed.indices),
    };
  }, [permText, n]);

  const punctureData = useMemo(() => {
    const pos = clampPosition(puncturePosition, n);
    const code = puncture(LINEAR.codewords, pos - 1);

    return {
      pos,
      code,
    };
  }, [puncturePosition, n]);

  const reductionData = useMemo(() => {
    const pos = clampPosition(reductionPosition, n);
    const code = shortenReduction(LINEAR.codewords, pos - 1);

    return {
      pos,
      code,
    };
  }, [reductionPosition, n]);

  return (
    <main className="container">
      <Nav />

      <section className="hero">
        <span className="badge">Punto II · Código lineal binario</span>

        <h1 className="title">
          Código lineal binario: generación, forma estándar y operaciones
        </h1>

        <p className="subtitle">
          Este módulo presenta la implementación computacional del código lineal
          binario generado por una matriz <Latex expr={"G"} />. Permite
          visualizar cómo se generan los mensajes de{" "}
          <Latex expr={"\\mathbb{F}_2^4"} />, cómo se calculan las palabras
          código mediante <Latex expr={"uG"} />, cómo se obtiene la forma
          estándar <Latex expr={"G_{est}=(I_4\\mid A)"} /> y cómo se construye
          la matriz de control <Latex expr={"H"} /> para verificar la relación{" "}
          <Latex expr={"HG^t=0"} />.
        </p>
      </section>

      <section className="section two">
        <div className="card">
          <h2>Matriz generadora dada</h2>
          <MatrixLatex name="G" matrix={LINEAR.G} />
          <Latex block expr={"C=\\{uG:u\\in\\mathbb{F}_2^4\\}"} />
        </div>

        <div className="card">
          <h2>Parámetros iniciales</h2>
          <Latex block expr={"n=7,\\quad k=4,\\quad |C|=2^4=16"} />
          

          <p className="text">
            Como el código es lineal, todos los codewords se obtienen
            multiplicando los 16 mensajes binarios <Latex expr={"u"} /> por{" "}
            <Latex expr={"G"} />.
          </p>
        </div>
      </section>

      <section className="section card">
        <h2>Algoritmo 1: construcción del código mediante uG</h2>

        <p className="text">
          Este algoritmo construye explícitamente el código lineal a partir de
          la matriz generadora. Cada vector <Latex expr={"u"} /> representa un
          mensaje binario de cuatro coordenadas.
        </p>

        <div className="algo-box">
          <ol>
            <li>
              <strong>Generar mensajes:</strong> formar todos los vectores{" "}
              <Latex expr={"u\\in\\mathbb{F}_2^4"} />.
            </li>
            <li>
              <strong>Multiplicar:</strong> calcular <Latex expr={"uG"} /> para
              cada mensaje.
            </li>
            <li>
              <strong>Reducir:</strong> aplicar módulo 2 a cada coordenada del
              producto.
            </li>
            <li>
              <strong>Guardar codeword:</strong> el vector resultante pertenece
              a <Latex expr={"C"} />.
            </li>
            <li>
              <strong>Calcular peso:</strong> contar las coordenadas no nulas de
              cada codeword.
            </li>
            <li>
              <strong>Calcular distancia mínima:</strong> como el código es
              lineal, tomar el menor peso no nulo.
            </li>
          </ol>
        </div>

        <ProductTable
          rows={LINEAR.rows}
          title="Tabla de mensajes u y productos uG"
        />

        <CodeSet label="C" codewords={LINEAR.codewords} />
        <Latex block expr={"[n,k,d]=[7,4,3]_2"} />
      </section>

      <section className="section card">
        <h2>Algoritmo 2: obtención de la forma estándar</h2>

        <p className="text">
          La forma estándar permite separar un bloque identidad y facilita la
          construcción de la matriz de control. Se obtiene usando operaciones
          elementales por filas sobre <Latex expr={"\\mathbb{F}_2"} />.
        </p>

        <Latex block expr={"G_{est}=(I_4\\mid A)"} />

        <div className="algo-box">
          <ol>
            <li>
              Tomar la matriz generadora original <Latex expr={"G"} />.
            </li>
            <li>Buscar pivotes de izquierda a derecha.</li>
            <li>Intercambiar filas si es necesario.</li>
            <li>
              Sumar filas módulo 2 para anular entradas fuera de cada pivote.
            </li>
            <li>
              Continuar hasta obtener el bloque identidad{" "}
              <Latex expr={"I_4"} />.
            </li>
            <li>
              Separar el bloque restante <Latex expr={"A"} />.
            </li>
          </ol>
        </div>

        <StandardizationSteps steps={LINEAR.reduced.steps} />
        <MatrixLatex name="G_{est}" matrix={LINEAR.reduced.matrix} />
        <MatrixLatex name="A" matrix={LINEAR.A} />
      </section>

      <section className="section card">
        <h2>Algoritmo 3: construcción de la matriz de control</h2>

        <p className="text">
          Con <Latex expr={"G"} /> en forma estándar, la matriz de control se
          obtiene de manera directa. En <Latex expr={"\\mathbb{F}_2"} /> el signo
          negativo no cambia los valores porque <Latex expr={"-1=1"} />.
        </p>

        <Latex block expr={"H=(-A^t\\mid I_3)"} />
        <MatrixLatex name="H" matrix={LINEAR.H} />
        <Latex block expr={"HG^t=0"} />

        <div className="algo-box">
          <ol>
            <li>
              Tomar el bloque <Latex expr={"A"} /> de{" "}
              <Latex expr={"G_{est}"} />.
            </li>
            <li>
              Calcular la transpuesta de <Latex expr={"A"} />.
            </li>
            <li>
              Formar el bloque izquierdo menos <Latex expr={"A^t"} />; en{" "}
              <Latex expr={"\\mathbb{F}_2"} /> es igual a{" "}
              <Latex expr={"A^t"} />.
            </li>
            <li>
              Agregar el bloque identidad <Latex expr={"I_3"} />.
            </li>
            <li>
              Verificar que el producto <Latex expr={"HG^t"} /> sea cero.
            </li>
            <li>
              Usar <Latex expr={"H"} /> para calcular síndromes si se analiza
              una palabra recibida.
            </li>
          </ol>
        </div>
      </section>

      <section className="section card">
        <h2>Auto-dualidad</h2>

        <p className="text">
          Para que un código sea auto-dual debe coincidir con su dual. Una
          condición necesaria es que la longitud sea el doble de la dimensión.
        </p>

        <Latex block expr={"C=C^\\perp\\Rightarrow n=2k"} />
        <Latex block expr={"n=7,\\quad k=4,\\quad 2k=8\\ne7"} />

        <span className="pill warn">
          Conclusión: el código no es auto-dual.
        </span>
      </section>

      <section className="section card">
        <h2>Algoritmo 4: código equivalente</h2>

        <p className="text">
          Se construye un código equivalente aplicando una permutación de
          coordenadas. En esta versión, el usuario puede escoger cualquier
          permutación válida de las siete columnas de la matriz generadora.
        </p>

        <div className="algo-box">
          <label>Permutación de columnas</label>

          <input
            value={permText}
            onChange={(e) => setPermText(e.target.value)}
            placeholder="Ejemplo: 2,1,3,4,5,6,7"
          />

          <p className="text">
            Escriba una permutación de los números del 1 al 7. Por ejemplo,{" "}
            <Latex expr={"(2,1,3,4,5,6,7)"} /> intercambia las columnas 1 y 2.
            La permutación indica el nuevo orden de las columnas de{" "}
            <Latex expr={"G"} />.
          </p>

          <span className={permutationData.valid ? "pill ok" : "pill warn"}>
            {permutationData.valid
              ? "Permutación válida"
              : "Permutación inválida: se usa la identidad"}
          </span>
        </div>

        <Latex block expr={permutationData.latexPermutation} />

        <div className="algo-box">
          <h3>Columnas afectadas por la permutación</h3>

          <p className="text">
            La permutación ingresada se interpreta como el nuevo orden de las
            columnas de la matriz generadora. Es decir, cada posición de la
            permutación indica qué columna original pasa a ocupar esa nueva
            posición.
          </p>

          <p className="text">{permutationData.affectedColumns.text}.</p>

          {permutationData.affectedColumns.affected.length > 0 && (
            <ul>
              {permutationData.affectedColumns.affected.map((item, index) => (
                <li key={index}>
                  La columna original <Latex expr={`${item.oldPosition}`} />{" "}
                  pasa a la posición{" "}
                  <Latex expr={`${item.newPosition}`} />.
                </li>
              ))}
            </ul>
          )}
        </div>

        <Latex block expr={"C_{eq}=\\pi(C)"} />

        <div className="algo-box">
          <ol>
            <li>Elegir una permutación válida de columnas.</li>
            <li>
              Reordenar las columnas de <Latex expr={"G"} /> según la
              permutación escogida.
            </li>
            <li>
              Obtener la nueva matriz <Latex expr={"G_{eq}"} />.
            </li>
            <li>
              Generar todos los productos <Latex expr={"uG_{eq}"} />.
            </li>
            <li>Listar el código equivalente.</li>
            <li>
              Verificar que la distancia de Hamming se conserva porque solo se
              cambia el orden de las coordenadas.
            </li>
          </ol>
        </div>

        <MatrixLatex name="G_{eq}" matrix={permutationData.Geq} />
        <Latex block expr={"C_{eq}=\\{uG_{eq}:u\\in\\mathbb{F}_2^4\\}"} />
        <CodeSet label="C_{eq}" codewords={permutationData.codeEq} />

        <CodewordTable
          codewords={permutationData.codeEq}
          title="Codewords del código equivalente"
        />
      </section>

      <section className="section card">
        <h2>Algoritmo 5: código de extensión</h2>

        <p className="text">
          La extensión agrega un bit de paridad al final de cada palabra para
          que la suma total de coordenadas sea cero en{" "}
          <Latex expr={"\\mathbb{F}_2"} />.
        </p>

        <Latex
          block
          expr={
            "\\widehat{C}=\\{(c_1,\\ldots,c_n,c_{n+1}):\\sum_{j=1}^{n+1}c_j=0\\}"
          }
        />

        <div className="algo-box">
          <ol>
            <li>
              Tomar un codeword <Latex expr={"c=(c_1,\\ldots,c_n)"} />.
            </li>
            <li>
              Calcular la suma <Latex expr={"c_1+\\cdots+c_n"} /> módulo 2.
            </li>
            <li>
              Elegir la coordenada adicional de paridad para completar paridad
              par.
            </li>
            <li>
              Formar la palabra extendida agregando esa coordenada al final.
            </li>
            <li>Repetir para todos los codewords.</li>
            <li>Listar el código extendido.</li>
          </ol>
        </div>

        <Latex block expr={"\\widehat{C}\\text{ es el código extendido}"} />
        <CodeSet number={1} label="\\widehat{C}" codewords={LINEAR.extension} />

        <CodewordTable
          codewords={LINEAR.extension}
          title="Codewords extendidos"
        />
      </section>

      <section className="section card">
        <h2>Algoritmo 6: código de perforación</h2>

        <p className="text">
          La perforación elimina una coordenada fija de todas las palabras, sin
          importar el valor que tenga esa coordenada. En esta versión, el usuario
          puede escoger la coordenada que desea eliminar.
        </p>

        <div className="algo-box">
          <label>Coordenada a perforar</label>

          <input
            type="number"
            min={1}
            max={n}
            value={puncturePosition}
            onChange={(e) => setPuncturePosition(Number(e.target.value))}
          />

          <p className="text">
            Actualmente se elimina la coordenada{" "}
            <Latex expr={`i=${punctureData.pos}`} />.
          </p>
        </div>

        <Latex
          block
          expr={`\\mathring{C}(${punctureData.pos})=\\{(c_1,\\ldots,\\widehat{c_${punctureData.pos}},\\ldots,c_${n}):c\\in C\\}`}
        />

        <div className="algo-box">
          <ol>
            <li>
              Elegir la coordenada que se va a eliminar; aquí{" "}
              <Latex expr={`i=${punctureData.pos}`} />.
            </li>
            <li>
              Tomar cada codeword de <Latex expr={"C"} />.
            </li>
            <li>Eliminar la coordenada escogida.</li>
            <li>
              Conservar la palabra restante de longitud{" "}
              <Latex expr={`${n - 1}`} />.
            </li>
            <li>Eliminar duplicados si aparecen.</li>
            <li>Listar el código perforado.</li>
          </ol>
        </div>

        <Latex
          block
          expr={`\\mathring{C}(${punctureData.pos})\\text{ es el código perforado}`}
        />

        <CodeSet
          number={2}
          label={`\\mathring{C}(${punctureData.pos})`}
          codewords={punctureData.code}
        />

        <CodewordTable
          codewords={punctureData.code}
          title={`Codewords perforados en la coordenada ${punctureData.pos}`}
        />
      </section>

      <section className="section card">
        <h2>Algoritmo 7: código de reducción</h2>

        <p className="text">
          La reducción primero filtra las palabras cuya coordenada elegida es
          igual a cero y luego elimina esa coordenada. En esta versión, el
          usuario puede escoger la coordenada de reducción.
        </p>

        <div className="algo-box">
          <label>Coordenada de reducción</label>

          <input
            type="number"
            min={1}
            max={n}
            value={reductionPosition}
            onChange={(e) => setReductionPosition(Number(e.target.value))}
          />

          <p className="text">
            Actualmente se reduce respecto a la coordenada{" "}
            <Latex expr={`i=${reductionData.pos}`} />.
          </p>
        </div>

        <Latex
          block
          expr={`\\breve{C}(${reductionData.pos})=\\{(c_1,\\ldots,\\widehat{c_${reductionData.pos}},\\ldots,c_${n}):c\\in C,\\ c_${reductionData.pos}=0\\}`}
        />

        <div className="algo-box">
          <ol>
            <li>
              Elegir la coordenada de reducción; aquí{" "}
              <Latex expr={`i=${reductionData.pos}`} />.
            </li>
            <li>
              Revisar todos los codewords de <Latex expr={"C"} />.
            </li>
            <li>
              Conservar solo aquellos cuya coordenada{" "}
              <Latex expr={`${reductionData.pos}`} /> sea cero.
            </li>
            <li>Eliminar la coordenada escogida de las palabras conservadas.</li>
            <li>Eliminar duplicados si aparecen.</li>
            <li>Listar el código reducido.</li>
          </ol>
        </div>

        <Latex
          block
          expr={`\\breve{C}(${reductionData.pos})\\text{ es el código reducido}`}
        />

        <CodeSet
          number={3}
          label={`\\breve{C}(${reductionData.pos})`}
          codewords={reductionData.code}
        />

        <CodewordTable
          codewords={reductionData.code}
          title={`Codewords reducidos en la coordenada ${reductionData.pos}`}
        />
      </section>

      <Footer />
    </main>
  );
}