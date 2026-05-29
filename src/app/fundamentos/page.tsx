"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Latex } from "@/components/Latex";
import TheoryModal from "@/components/TheoryModal";
const fundamentos = [
  {
    title: "Códigos de bloque",
    formula: "C\\subseteq K^n",
    definitionFormula: "C\\ne\\varnothing,\\ C\\subseteq K^n",
    definition:
      "Un código de bloque de longitud n sobre un alfabeto K es un conjunto no vacío de palabras donde todas tienen exactamente n coordenadas.",
    implementation:
      "Permite reconocer que los códigos construidos en los puntos son conjuntos de palabras de longitud fija: Reed–Solomon tiene longitud 5, el lineal binario longitud 7 y el cíclico longitud 7.",
    exerciseIntro:
      "Determinar si C={0000,1011,0110,1101} es un código de bloque binario.",
    exerciseFormula: "C=\\{0000,1011,0110,1101\\}",
    steps: [
      "Se verifica que cada palabra tiene 4 coordenadas.",
      "Se verifica que todas las coordenadas pertenecen a F2={0,1}.",
      "El conjunto no es vacío.",
      "Como todas las palabras pertenecen a F2^4, se concluye que C es un código de bloque.",
    ],
    resultFormula: "C\\subseteq\\mathbb{F}_2^4,\\quad n=4,\\quad |C|=4",
    conclusion: "El conjunto sí es un código de bloque binario de longitud 4.",
  },
  {
    title: "Distancia de Hamming",
    formula: "d(u,v)=|\\{j:u_j\\ne v_j\\}|",
    definitionFormula: "u,v\\in K^n",
    definition:
      "La distancia de Hamming mide cuántas posiciones cambian entre dos palabras de igual longitud.",
    implementation:
      "Se usa para calcular la distancia mínima y medir capacidad de detección/corrección de errores.",
    exerciseIntro: "Calcular d(10110,10011).",
    exerciseFormula: "u=10110,\\quad v=10011",
    steps: [
      "Compare posición 1: 1=1, no suma distancia.",
      "Compare posición 2: 0=0, no suma distancia.",
      "Compare posición 3: 1≠0, suma 1.",
      "Compare posición 4: 1=1, no suma distancia.",
      "Compare posición 5: 0≠1, suma 1.",
    ],
    resultFormula: "d(u,v)=2",
    conclusion:
      "Las palabras difieren en dos posiciones, por tanto su distancia es 2.",
  },
  {
    title: "Distancia mínima",
    formula: "d(C)=\\min\\{d(c,c^\\prime):c\\ne c^\\prime\\}",
    definitionFormula: "c,c^\\prime\\in C",
    definition:
      "La distancia mínima es la menor distancia entre dos codewords distintos.",
    implementation:
      "En las validaciones computacionales se calcula comparando pares de palabras generadas.",
    exerciseIntro: "Calcular d(C) para C={000,111,101}.",
    exerciseFormula: "C=\\{000,111,101\\}",
    steps: [
      "Calcule d(000,111)=3.",
      "Calcule d(000,101)=2.",
      "Calcule d(111,101)=1.",
      "Seleccione el menor valor obtenido.",
    ],
    resultFormula: "d(C)=1",
    conclusion: "El código tiene distancia mínima 1.",
  },
  {
    title: "Peso de Hamming",
    formula: "wt(x)=d(x,0)",
    definitionFormula: "wt(x)=|\\{j:x_j\\ne0\\}|",
    definition:
      "El peso es la cantidad de coordenadas no nulas de una palabra.",
    implementation:
      "Para códigos lineales, la distancia mínima se puede obtener como el menor peso no nulo.",
    exerciseIntro: "Calcular wt(101101).",
    exerciseFormula: "x=101101",
    steps: [
      "Identifique las coordenadas no nulas.",
      "Las posiciones no nulas son 1,3,4 y 6.",
      "Cuente esas posiciones.",
    ],
    resultFormula: "wt(x)=4",
    conclusion: "La palabra tiene peso 4.",
  },
  {
    title: "Código lineal",
    formula: "C\\le K^n",
    definitionFormula: "C\\text{ subespacio vectorial}",
    definition:
      "Un código lineal es un subespacio: contiene el cero y es cerrado bajo suma y multiplicación escalar.",
    implementation:
      "El Punto II y el código cíclico se generan por matrices; esto garantiza linealidad.",
    exerciseIntro: "Verificar una suma en F2: 1011+0110.",
    exerciseFormula: "1011+0110",
    steps: [
      "Sume coordenada por coordenada en F2.",
      "1+0=1.",
      "0+1=1.",
      "1+1=0 en F2.",
      "1+0=1.",
    ],
    resultFormula: "1011+0110=1101",
    conclusion: "La suma sigue siendo una palabra binaria.",
  },
  {
    title: "Matriz generadora",
    formula: "C=\\{uG:u\\in K^k\\}",
    definitionFormula: "G\\in Mat_{k\\times n}(K)",
    definition:
      "Una matriz generadora contiene filas base; los mensajes multiplican G para producir codewords.",
    implementation:
      "En los puntos se usa para Reed–Solomon, lineal binario y cíclico.",
    exerciseIntro: "Calcular uG con u=(1,1).",
    exerciseFormula:
      "G=\\begin{bmatrix}1&0&1\\\\0&1&1\\end{bmatrix},\\quad u=(1,1)",
    steps: [
      "Como u=(1,1), se suman las dos filas de G.",
      "Fila 1: (1,0,1).",
      "Fila 2: (0,1,1).",
      "Suma en F2: (1,1,0).",
    ],
    resultFormula: "uG=(1,1,0)",
    conclusion: "El codeword generado es 110.",
  },
  {
    title: "Forma estándar",
    formula: "G_{est}=(I_k\\mid A)",
    definitionFormula: "I_k\\text{ identidad}",
    definition: "La forma estándar separa un bloque identidad y un bloque A.",
    implementation: "Se utiliza para construir directamente H=(-A^t|I).",
    exerciseIntro: "Identificar k,n y A.",
    exerciseFormula: "G=\\begin{bmatrix}1&0&1&1\\\\0&1&0&1\\end{bmatrix}",
    steps: [
      "Las dos primeras columnas forman I2.",
      "Por ello k=2.",
      "La matriz tiene n=4 columnas.",
      "El bloque A son las columnas restantes.",
    ],
    resultFormula: "A=\\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}",
    conclusion: "La matriz está en forma estándar.",
  },
  {
    title: "Matriz de control",
    formula: "C=\\{x\\in K^n:Hx^t=0\\}",
    definitionFormula: "HG^t=0",
    definition:
      "La matriz de control verifica pertenencia mediante el síndrome.",
    implementation:
      "En las secciones se calcula H para validar codewords y decodificar palabras recibidas.",
    exerciseIntro: "Verificar si x=101 pertenece al código con H=[1 1 1].",
    exerciseFormula: "H=\\begin{bmatrix}1&1&1\\end{bmatrix},\\quad x=(1,0,1)",
    steps: ["Calcule Hx^t=1·1+1·0+1·1.", "El resultado es 2.", "En F2, 2≡0."],
    resultFormula: "Hx^t=0",
    conclusion: "La palabra tiene síndrome cero y pertenece al código.",
  },
  {
    title: "Código dual",
    formula: "C^\\perp=\\{x:x\\cdot c=0,\\forall c\\in C\\}",
    definitionFormula: "\\dim C+\\dim C^\\perp=n",
    definition:
      "El dual contiene los vectores ortogonales a todas las palabras del código.",
    implementation:
      "La matriz de control puede verse como generadora del código dual.",
    exerciseIntro: "Decidir si un código [7,4] puede ser auto-dual.",
    exerciseFormula: "C=C^\\perp\\Rightarrow k=n-k",
    steps: [
      "Si C es auto-dual, entonces n=2k.",
      "Para k=4 se tendría n=8.",
      "Pero el código tiene n=7.",
    ],
    resultFormula: "7\\ne8",
    conclusion: "No puede ser auto-dual.",
  },
  {
    title: "Código equivalente",
    formula: "C_{eq}=\\pi(C)",
    definitionFormula: "\\pi\\text{ permutación}",
    definition:
      "Un código equivalente se obtiene permutando coordenadas; conserva distancias.",
    implementation: "En el Punto II se usa intercambiando columnas de G.",
    exerciseIntro: "Aplicar π=(1 2) a 1011.",
    exerciseFormula: "c=(1,0,1,1)",
    steps: [
      "Intercambie la primera y segunda coordenada.",
      "La palabra pasa de (1,0,1,1) a (0,1,1,1).",
      "Las distancias se conservan porque solo cambia el orden.",
    ],
    resultFormula: "\\pi(c)=(0,1,1,1)",
    conclusion: "El codeword equivalente es 0111.",
  },
  {
    title: "Código de extensión",
    formula: "\\widehat{C}",
    definitionFormula: "\\widehat{c}=(c,p)",
    definition: "La extensión agrega una coordenada, normalmente de paridad.",
    implementation:
      "En el Punto II se agrega paridad para que la suma total sea cero.",
    exerciseIntro: "Extender c=101.",
    exerciseFormula: "c=(1,0,1)",
    steps: [
      "Calcule la suma 1+0+1=2.",
      "En F2, 2≡0.",
      "Para paridad par se agrega p=0.",
    ],
    resultFormula: "\\widehat{c}=(1,0,1,0)",
    conclusion: "La palabra extendida es 1010.",
  },
  {
    title: "Código de perforación",
    formula: "\\mathring{C}(i)",
    definitionFormula: "\\text{eliminar coordenada }i",
    definition:
      "La perforación elimina una coordenada fija de todos los codewords.",
    implementation: "Se usa para construir un código de menor longitud.",
    exerciseIntro: "Perforar c=1011 en i=2.",
    exerciseFormula: "c=(1,0,1,1)",
    steps: [
      "Identifique la coordenada 2, que es 0.",
      "Elimine esa coordenada.",
      "Conserve las posiciones 1,3,4.",
    ],
    resultFormula: "\\mathring{c}(2)=(1,1,1)",
    conclusion: "La palabra perforada es 111.",
  },
  {
    title: "Código de reducción",
    formula: "\\breve{C}(i)",
    definitionFormula: "c_i=0\\text{ y luego eliminar }i",
    definition:
      "La reducción conserva palabras con coordenada i igual a cero y luego elimina esa coordenada.",
    implementation: "Es una operación más restrictiva que la perforación.",
    exerciseIntro: "Reducir c=1010 en i=4.",
    exerciseFormula: "c=(1,0,1,0)",
    steps: [
      "La coordenada 4 vale 0.",
      "La palabra se conserva.",
      "Se elimina la cuarta coordenada.",
    ],
    resultFormula: "\\breve{c}(4)=(1,0,1)",
    conclusion: "La palabra reducida es 101.",
  },
  {
    title: "Reed–Solomon",
    formula: "C(A)=\\{(f(a_1),\\ldots,f(a_n)):deg(f)<k\\}",
    definitionFormula: "A\\subseteq K",
    definition:
      "Un Reed–Solomon evalúa polinomios de grado menor que k en puntos distintos.",
    implementation: "El Punto I usa F5 con n=5 y k=3.",
    exerciseIntro: "Codificar f(x)=1+2x en A={0,1,2}.",
    exerciseFormula: "f(x)=1+2x",
    steps: ["f(0)=1.", "f(1)=1+2=3.", "f(2)=1+4=5≡0 en F5."],
    resultFormula: "(f(0),f(1),f(2))=(1,3,0)",
    conclusion: "El codeword es (1,3,0).",
  },
  {
    title: "Matriz de Vandermonde",
    formula: "G_{ij}=a_j^{i-1}",
    definitionFormula: "G=(a_j^{i-1})",
    definition:
      "La matriz de Vandermonde organiza las potencias de los puntos de evaluación.",
    implementation: "Genera los codewords Reed–Solomon mediante uG.",
    exerciseIntro: "Construir G para A={0,1,2}, k=3.",
    exerciseFormula: "A=\\{0,1,2\\}",
    steps: [
      "Fila 1: potencias grado 0 → (1,1,1).",
      "Fila 2: potencias grado 1 → (0,1,2).",
      "Fila 3: potencias grado 2 → (0,1,4).",
    ],
    resultFormula: "G=\\begin{bmatrix}1&1&1\\\\0&1&2\\\\0&1&4\\end{bmatrix}",
    conclusion: "Esta es la Vandermonde asociada.",
  },
  {
    title: "Cota de Singleton y MDS",
    formula: "d\\le n-k+1",
    definitionFormula: "d=n-k+1\\Rightarrow MDS",
    definition: "La cota de Singleton limita la distancia mínima de un código.",
    implementation:
      "Reed–Solomon alcanza esta cota cuando los puntos son distintos.",
    exerciseIntro: "Calcular la cota para n=5,k=3.",
    exerciseFormula: "d\\le n-k+1",
    steps: ["Sustituya n=5 y k=3.", "d≤5−3+1.", "d≤3."],
    resultFormula: "d\\le3",
    conclusion: "Si d=3, el código es MDS.",
  },
  {
    title: "Código cíclico",
    formula: "c(x)=m(x)g(x)\\pmod{x^n-1}",
    definitionFormula: "C\\subseteq\\mathbb F_2[x]/(x^n-1)",
    definition: "Un código cíclico es estable bajo desplazamientos cíclicos.",
    implementation:
      "El Punto III construye un código binario cíclico de longitud 7.",
    exerciseIntro: "Calcular c(x) para m(x)=1+x y g(x)=x³+x+1.",
    exerciseFormula: "m(x)=1+x,\\quad g(x)=x^3+x+1",
    steps: [
      "Multiplique (1+x)(x³+x+1).",
      "Obtenga x³+x+1+x⁴+x²+x.",
      "En F2, x+x=0.",
      "Queda x⁴+x³+x²+1.",
    ],
    resultFormula: "c(x)=x^4+x^3+x^2+1",
    conclusion: "El vector asociado es (1,0,1,1,1,0,0).",
  },
];
export default function Page() {
  const [selected, setSelected] = useState<any>(null);
  return (
    <main className="container">
      <Nav />
      <section className="hero">
        <span className="badge">Fundamentos teóricos completos</span>
        <h1 className="title">
          Base conceptual para construir y validar códigos
        </h1>
        <p className="subtitle">
          Esta sección presenta los fundamentos matemáticos necesarios para
          comprender la construcción e implementación de los códigos trabajados.
          Incluye conceptos como código de bloque{" "}
          <Latex expr={"C\\subseteq K^n"} />, distancia de Hamming, peso, matriz
          generadora, matriz de control, código dual, códigos equivalentes,
          Reed–Solomon y códigos cíclicos.
        </p>
      </section>
      <section className="section three">
        {fundamentos.map((f: any, i: number) => (
          <button
            className="card theory-card"
            key={i}
            onClick={() => setSelected(f)}
          >
            <h2>{f.title}</h2>
            <Latex block expr={f.formula} />
            <p className="text">
              Haz clic para ver definición, aplicación y ejemplo completo.
            </p>
          </button>
        ))}
      </section>
      {selected && (
        <TheoryModal item={selected} onClose={() => setSelected(null)} />
      )}
      <Footer />
    </main>
  );
}
