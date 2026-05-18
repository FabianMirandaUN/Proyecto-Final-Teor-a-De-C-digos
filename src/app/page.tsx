import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
export default function Home() {
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Trabajo final · Teoría de Códigos</span>
        <h1 className="title">
          Proyecto completo: puntos + simuladores dinámicos
        </h1>
        <p className="subtitle">
          Se conservan Fundamentos, Punto I, Punto II y Punto III con algoritmos
          paso a paso. Además, se agregan tres secciones dinámicas:
          Reed–Solomon, códigos lineales y códigos cíclicos.
        </p>
        <Latex
          block
          expr={
            "C\\subseteq K^n,\\quad C=\\{uG:u\\in K^k\\},\\quad C=\\{x\\in K^n:Hx^t=0\\}"
          }
        />
        <div className="grid">
          <div className="card">
            <h2>Fundamentos</h2>
            <Link href="/fundamentos" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Punto I</h2>
            <Link href="/reed-solomon" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Punto II</h2>
            <Link href="/codigo-lineal" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Punto III</h2>
            <Link href="/codigo-ciclico" className="btn">
              Abrir
            </Link>
          </div>
        </div>
        <div className="three section">
          <div className="card">
            <h2>RS dinámico</h2>
            <p className="text">
              Según lo solicitado para Reed–Solomon: cuerpo, mensajes,
              Vandermonde, H, algoritmo y validación.
            </p>
            <Link href="/codigos-reedsolomon" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Lineales dinámico</h2>
            <p className="text">
              Genera C, H, síndrome, equivalente, extensión, perforación y
              reducción.
            </p>
            <Link href="/codigos-lineales" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Cíclicos dinámico</h2>
            <p className="text">
              Controla n, g(x), mensajes, G, H, productos m(x)g(x), perforación
              y reducción.
            </p>
            <Link href="/codigos-ciclicos" className="btn">
              Abrir
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
