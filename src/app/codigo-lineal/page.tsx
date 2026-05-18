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
import { LINEAR } from "@/lib/linearCodes";
export default function Page() {
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Punto II · Código lineal binario</span>
        <h1 className="title">
          Código lineal binario: generación, forma estándar y operaciones
        </h1>
        <p className="subtitle">
          Se conserva la descripción completa de los algoritmos. Corrección
          aplicada: los subíndices con llaves se muestran en LaTeX o texto
          seguro para evitar errores de JSX.
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
            multiplicando los 16 mensajes binarios u por G.
          </p>
        </div>
      </section>
      <section className="section card">
        <h2>Algoritmo 1: construcción del código mediante uG</h2>
        <p className="text">
          Este algoritmo construye explícitamente el código lineal a partir de
          la matriz generadora. Cada vector u representa un mensaje binario de
          cuatro coordenadas.
        </p>
        <div className="algo-box">
          <ol>
            <li>
              <strong>Generar mensajes:</strong> formar todos los vectores
              u∈F2⁴.
            </li>
            <li>
              <strong>Multiplicar:</strong> calcular uG para cada mensaje.
            </li>
            <li>
              <strong>Reducir:</strong> aplicar módulo 2 a cada coordenada del
              producto.
            </li>
            <li>
              <strong>Guardar codeword:</strong> el vector resultante pertenece
              a C.
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
      </section>
      <section className="section card">
        <h2>Algoritmo 2: obtención de la forma estándar</h2>
        <p className="text">
          La forma estándar permite separar un bloque identidad y facilita la
          construcción de la matriz de control. Se obtiene usando operaciones
          elementales por filas sobre F2.
        </p>
        <Latex block expr={"G_{est}=(I_4\\mid A)"} />
        <div className="algo-box">
          <ol>
            <li>Tomar la matriz generadora original G.</li>
            <li>Buscar pivotes de izquierda a derecha.</li>
            <li>Intercambiar filas si es necesario.</li>
            <li>
              Sumar filas módulo 2 para anular entradas fuera de cada pivote.
            </li>
            <li>Continuar hasta obtener el bloque identidad I4.</li>
            <li>Separar el bloque restante A.</li>
          </ol>
        </div>
        <StandardizationSteps steps={LINEAR.reduced.steps} />
        <MatrixLatex name="G_{est}" matrix={LINEAR.reduced.matrix} />
        <MatrixLatex name="A" matrix={LINEAR.A} />
      </section>
      <section className="section card">
        <h2>Algoritmo 3: construcción de la matriz de control</h2>
        <p className="text">
          Con G en forma estándar, la matriz de control se obtiene de manera
          directa. En F2 el signo negativo no cambia los valores porque −1=1.
        </p>
        <Latex block expr={"H=(-A^t\\mid I_3)"} />
        <MatrixLatex name="H" matrix={LINEAR.H} />
        <Latex block expr={"HG^t=0"} />
        <div className="algo-box">
          <ol>
            <li>Tomar el bloque A de G_est.</li>
            <li>Calcular la transpuesta de A.</li>
            <li>
              Formar el bloque izquierdo menos A transpuesta; en F2 es igual a A
              transpuesta.
            </li>
            <li>Agregar el bloque identidad I3.</li>
            <li>Verificar que el producto HG transpuesta sea cero.</li>
            <li>
              Usar H para calcular síndromes si se analiza una palabra recibida.
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
          coordenadas. La operación especificada es intercambiar las columnas 1
          y 2.
        </p>
        <Latex block expr={"\\pi=(1\\ 2),\\quad C_{eq}=\\pi(C)"} />
        <div className="algo-box">
          <ol>
            <li>Elegir la permutación π=(1 2).</li>
            <li>Intercambiar las columnas 1 y 2 de G.</li>
            <li>Obtener la nueva matriz G_eq.</li>
            <li>Generar todos los productos uG_eq.</li>
            <li>Listar el código equivalente.</li>
            <li>Verificar que se conserva la distancia de Hamming.</li>
          </ol>
        </div>
        <MatrixLatex name="G_{eq}" matrix={LINEAR.Geq} />
        <CodeSet label="C_{eq}" codewords={LINEAR.codeEq} />
        <CodewordTable
          codewords={LINEAR.codeEq}
          title="Codewords del código equivalente"
        />
      </section>
      <section className="section card">
        <h2>Algoritmo 5: código de extensión</h2>
        <p className="text">
          La extensión agrega un bit de paridad al final de cada palabra para
          que la suma total de coordenadas sea cero en F2.
        </p>
        <Latex
          block
          expr={
            "\\widehat{C}=\\{(c_1,\\ldots,c_n,c_{n+1}):\\sum_{j=1}^{n+1}c_j=0\\}"
          }
        />
        <div className="algo-box">
          <ol>
            <li>Tomar un codeword c=(c1,...,cn).</li>
            <li>Calcular la suma c1+...+cn módulo 2.</li>
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
          importar el valor que tenga esa coordenada.
        </p>
        <Latex
          block
          expr={
            "\\mathring{C}(7)=\\{(c_1,\\ldots,c_6):(c_1,\\ldots,c_7)\\in C\\}"
          }
        />
        <div className="algo-box">
          <ol>
            <li>Elegir la coordenada que se va a eliminar; aquí i=7.</li>
            <li>Tomar cada codeword de C.</li>
            <li>Eliminar su séptima coordenada.</li>
            <li>Conservar la palabra restante de longitud 6.</li>
            <li>Eliminar duplicados si aparecen.</li>
            <li>Listar el código perforado.</li>
          </ol>
        </div>
        <CodeSet
          number={2}
          label="\\mathring{C}(7)"
          codewords={LINEAR.perforacion}
        />
        <CodewordTable
          codewords={LINEAR.perforacion}
          title="Codewords perforados"
        />
      </section>
      <section className="section card">
        <h2>Algoritmo 7: código de reducción</h2>
        <p className="text">
          La reducción primero filtra las palabras con coordenada elegida igual
          a cero y luego elimina esa coordenada.
        </p>
        <Latex
          block
          expr={
            "\\breve{C}(7)=\\{(c_1,\\ldots,c_6):(c_1,\\ldots,c_6,0)\\in C\\}"
          }
        />
        <div className="algo-box">
          <ol>
            <li>Elegir la coordenada de reducción; aquí i=7.</li>
            <li>Revisar todos los codewords de C.</li>
            <li>Conservar solo aquellos cuya coordenada 7 sea cero.</li>
            <li>Eliminar la coordenada 7 de las palabras conservadas.</li>
            <li>Eliminar duplicados si aparecen.</li>
            <li>Listar el código reducido.</li>
          </ol>
        </div>
        <CodeSet
          number={3}
          label="\\breve{C}(7)"
          codewords={LINEAR.reduccion}
        />
        <CodewordTable
          codewords={LINEAR.reduccion}
          title="Codewords reducidos"
        />
      </section>
      <Footer />
    </main>
  );
}
