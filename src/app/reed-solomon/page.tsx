import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import MatrixLatex from "@/components/MatrixLatex";
import { ReedSolomonTable } from "@/components/Tables";
import { RS } from "@/lib/reedSolomon";
export default function Page() {
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Punto I · Código Reed–Solomon sobre F5</span>
        <h1 className="title">
          Construcción explícita, matriz Vandermonde, matriz de control y
          validación
        </h1>
        <p className="subtitle">
          Este módulo presenta la construcción computacional del código
          Reed–Solomon sobre el cuerpo finito <Latex expr={"\\mathbb{F}_5"} />.
          Permite visualizar cómo los mensajes se representan como polinomios,
          cómo se forma la matriz generadora tipo Vandermonde, cómo se obtienen
          las palabras código y cómo se validan propiedades fundamentales como
          la matriz de control, la distancia mínima y la relación{" "}
          <Latex expr={"HG^t=0"} />.
        </p>
      </section>
      <section className="section two">
        <div className="card">
          <h2>1. Descripción del cuerpo F5</h2>
          <Latex block expr={"\\mathbb{F}_5=\\{0,1,2,3,4\\}"} />
          <p className="text">
            Como 5 es primo, las sumas, restas, productos e inversos no nulos se
            realizan módulo 5.
          </p>
          <Latex
            block
            expr={"6\\equiv1,\\quad -2\\equiv3,\\quad 4^{-1}=4\\pmod5"}
          />
        </div>
        <div className="card">
          <h2>2. Mensajes como polinomios</h2>
          <Latex block expr={"u=(a_0,a_1,a_2)\\in\\mathbb{F}_5^3"} />
          <Latex block expr={"f_u(x)=a_0+a_1x+a_2x^2"} />
          <p className="text">
            Cada mensaje produce un único polinomio de grado menor que 3.
          </p>
        </div>
      </section>
      <section className="section card">
        <h2>3. Construcción explícita con matriz de Vandermonde</h2>
        <Latex block expr={"A=\\{0,1,2,3,4\\}"} />
        <MatrixLatex name="G" matrix={RS.G} />
        <Latex
          block
          expr={"C(A)=\\{(f(0),f(1),f(2),f(3),f(4)):\\deg(f)<3\\}"}
        />
        <div className="algo-box">
          <ol>
            <li>Fijar los puntos de evaluación A.</li>
            <li>
              Construir la matriz de Vandermonde con filas 1, x y x² evaluadas
              en A.
            </li>
            <li>Tomar cada mensaje u=(a0,a1,a2).</li>
            <li>Calcular el producto uG.</li>
            <li>
              Interpretar uG como vector de evaluaciones del polinomio f_u.
            </li>
          </ol>
        </div>
      </section>
      <section className="section card">
        <h2>4. Algoritmo implementado para generar el código</h2>
        <div className="algo-box">
          <ol>
            <li>Inicializar el cuerpo K=F5.</li>
            <li>Generar los 5³=125 mensajes de longitud 3.</li>
            <li>Para cada mensaje u, construir f_u(x).</li>
            <li>Evaluar f_u en 0,1,2,3,4.</li>
            <li>Reducir cada evaluación módulo 5.</li>
            <li>Guardar cada vector obtenido como codeword.</li>
            <li>Calcular el peso de cada codeword.</li>
            <li>Calcular la distancia mínima comparando pares de codewords.</li>
          </ol>
        </div>
        <h3>Ejemplo</h3>
        <Latex block expr={"u=(1,2,3),\\quad f(x)=1+2x+3x^2"} />
        <Latex block expr={"uG=(1,1,2,4,2)"} />
      </section>
      <section className="section card">
        <h2>5. Matriz de control</h2>
        <MatrixLatex name="RREF(G)" matrix={RS.rref.matrix} />
        <MatrixLatex name="H" matrix={RS.H} />
        <Latex block expr={"HG^t=0"} />
        <div className="algo-box">
          <ol>
            <li>Resolver el sistema Gx^t=0 sobre F5.</li>
            <li>Identificar variables libres.</li>
            <li>Construir una base del núcleo.</li>
            <li>Usar esa base como filas de H.</li>
            <li>Verificar HG^t=0.</li>
          </ol>
        </div>
      </section>
      <section className="section card">
        <h2>6. Validación computacional</h2>
        <Latex block expr={"d=n-k+1=5-3+1=3"} />
        <Latex block expr={"[n,k,d]=[5,3,3]_5"} />
        <span className="pill">Mensajes: {RS.rows.length}</span>
        <span className="pill">Codewords: {RS.codewords.length}</span>
        <span className="pill">Distancia mínima: {RS.d}</span>
      </section>
      <section className="section card">
        <ReedSolomonTable rows={RS.rows} />
      </section>
      <Footer />
    </main>
  );
}
