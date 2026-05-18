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
          CodeLab: Simulador Interactivo de Teoría de Códigos
        </h1>
        <p className="subtitle">
          Plataforma web interactiva para la construcción y análisis de códigos Reed–Solomon, lineales y cíclicos, con generación automática de resultados y simulación dinámica de parámetros en tiempo real.
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
            <Link href="/codigos-reedsolomon" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Lineales dinámico</h2>
            <Link href="/codigos-lineales" className="btn">
              Abrir
            </Link>
          </div>
          <div className="card">
            <h2>Cíclicos dinámico</h2>
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
