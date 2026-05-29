import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { CyclicTable, CodeSet } from "@/components/Tables";
import { CYCLIC } from "@/lib/cyclicCodes";
export default function Page() {
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Punto III · Código binario cíclico</span>
        <h1 className="title">
          Código cíclico binario no trivial de longitud 7
        </h1>
        <p className="subtitle">
          Este módulo desarrolla la construcción computacional de un código
          binario cíclico no trivial de longitud <Latex expr={"n=7"} />. A
          partir del polinomio generador <Latex expr={"g(x)=x^3+x+1"} />, la
          aplicación construye la matriz generadora, obtiene las palabras
          código, calcula la matriz de control y verifica propiedades
          fundamentales como <Latex expr={"HG^t=0"} />, la distancia mínima y el
          cierre cíclico.
        </p>
      </section>
      <section className="section two">
        <div className="card">
          <h2>1. Datos y anillo</h2>
          <Latex
            block
            expr={
              "K=\\mathbb{F}_2,\\quad n=7,\\quad R=\\mathbb{F}_2[x]/(x^7-1)"
            }
          />
        </div>
        <div className="card">
          <h2>2. Polinomio generador</h2>
          <Latex block expr={"g(x)=x^3+x+1"} />
          <Latex block expr={"k=n-\\deg(g)=7-3=4"} />
        </div>
      </section>
      <section className="section card">
        <h2>3. Construcción del código cíclico</h2>
        <Latex block expr={"m(x)=m_0+m_1x+m_2x^2+m_3x^3"} />
        <Latex block expr={"c(x)=m(x)g(x)\\pmod{x^7-1}"} />
        <div className="algo-box">
          <ol>
            <li>Elegir g(x)=x³+x+1.</li>
            <li>Determinar k=4.</li>
            <li>Generar todos los mensajes binarios u∈F2⁴.</li>
            <li>Interpretar cada u como m(x).</li>
            <li>Multiplicar m(x)g(x) módulo x⁷−1.</li>
            <li>Leer coeficientes como vector de longitud 7.</li>
          </ol>
        </div>
        <h3>Ejemplo</h3>
        <Latex
          block
          expr={"m(x)=1+x,\\quad c(x)=(1+x)(x^3+x+1)=x^4+x^3+x^2+1"}
        />
        <Latex block expr={"c=(1,0,1,1,1,0,0)"} />
      </section>
      <section className="section card">
        <h2>4. Matriz generadora y matriz de control</h2>
        <MatrixLatex name="G" matrix={CYCLIC.G} />
        <MatrixLatex name="H" matrix={CYCLIC.H} />
        <Latex block expr={"HG^t=0"} />
        <div className="algo-box">
          <ol>
            <li>Escribir g(x) como vector.</li>
            <li>Construir filas desplazadas de g(x).</li>
            <li>Usar esas filas como matriz generadora G.</li>
            <li>Calcular H como base del núcleo de G.</li>
            <li>Verificar HG^t=0.</li>
          </ol>
        </div>
      </section>
      <section className="section card">
        <h2>5. Parámetros y listado de codewords</h2>
        <Latex block expr={"[n,k,d]=[7,4,3]_2"} />
        <CodeSet label="C" codewords={CYCLIC.codewords} />
        <CyclicTable rows={CYCLIC.rows} />
      </section>
      <Footer />
    </main>
  );
}
