import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, CheckCircle2, ChevronRight, FileText, GraduationCap, History, Loader2, RotateCcw, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_page: number;
};
type Attempt = { id: number; document_name: string; score: number; total: number; created_at: string };

export default function App() {
  const [documentId, setDocumentId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [count, setCount] = useState(5);

  async function loadProgress() {
    try {
      const response = await fetch(`${API}/api/progress`);
      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts || []);
      }
    } catch { /* backend may not be running yet */ }
  }
  useEffect(() => { void loadProgress(); }, []);

  const average = useMemo(() => {
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((sum, a) => sum + (a.total ? a.score / a.total * 100 : 0), 0) / attempts.length);
  }, [attempts]);

  async function uploadFile(file?: File) {
    if (!file) return;
    setError(""); setStatus(""); setResults(null); setQuestions([]); setAnswers({});
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file."); return;
    }
    const form = new FormData(); form.append("file", file);
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed.");
      setDocumentId(data.document_id); setDocumentName(data.filename); setPreview(data.preview || "");
      setStatus(`${data.pages_with_text} page(s) processed · ${data.characters_extracted.toLocaleString()} characters extracted.`);
    } catch (e: any) { setError(e.message || "Could not connect to backend. Is FastAPI running?"); }
    finally { setBusy(false); }
  }

  async function generateQuiz() {
    setError(""); setResults(null); setBusy(true);
    try {
      const response = await fetch(`${API}/api/quizzes/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question_count: count }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not generate quiz.");
      setQuestions(data.questions); setAnswers({});
      setStatus(data.note || "Quiz ready.");
    } catch (e: any) { setError(e.message || "Quiz generation failed."); }
    finally { setBusy(false); }
  }

  async function submitQuiz() {
    setError(""); setBusy(true);
    try {
      const response = await fetch(`${API}/api/quizzes/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId, document_name: documentName,
          answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
          questions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not submit quiz.");
      setResults(data); await loadProgress();
    } catch (e: any) { setError(e.message || "Submission failed."); }
    finally { setBusy(false); }
  }

  function resetQuiz() { setQuestions([]); setAnswers({}); setResults(null); setError(""); setStatus(""); }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><GraduationCap size={23}/></div><div><strong>StudyPilot</strong><span>AI STUDY SPACE</span></div></div>
        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active"><BookOpen size={18}/> Study dashboard</div>
        <div className="nav-item"><Brain size={18}/> Practice quizzes</div>
        <div className="nav-item"><History size={18}/> Learning history</div>
        <div className="sidebar-bottom"><div className="privacy-icon"><ShieldCheck size={18}/></div><div><strong>Your learning, your pace</strong><p>Use notes you have permission to share. Check answers against your source material.</p></div></div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>Study dashboard</b></div><div className="avatar">SP</div></header>
        <section className="welcome">
          <div><div className="eyebrow"><Sparkles size={15}/> YOUR PERSONAL STUDY SPACE</div><h1>Study smarter.<br/><span>Not longer.</span></h1><p>Turn your class notes into practice questions and build confidence one session at a time.</p></div>
          <div className="welcome-art"><div className="art-circle"><BookOpen size={48}/></div><div className="floating-card"><CheckCircle2 size={17}/> Small steps add up</div></div>
        </section>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><FileText size={19}/></div><span>Current document</span><strong className="stat-value document-stat">{documentName || "Not uploaded"}</strong><small>{documentName ? "Ready to study" : "Upload notes to begin"}</small></div>
          <div className="stat-card"><div className="stat-icon blue"><Brain size={19}/></div><span>Quiz attempts</span><strong className="stat-value">{attempts.length}</strong><small>Saved practice sessions</small></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19}/></div><span>Average score</span><strong className="stat-value">{average}%</strong><small>Across saved attempts</small></div>
        </section>

        <div className="content-grid">
          <section className="panel upload-panel">
            <div className="section-heading"><div><div className="eyebrow">STEP 01</div><h2>Bring your notes</h2><p>Upload a text-based PDF to start a study session.</p></div><div className="heading-icon"><UploadCloud size={22}/></div></div>
            <label className="dropzone">
              <input type="file" accept="application/pdf,.pdf" onChange={e => uploadFile(e.target.files?.[0])}/>
              <div className="upload-icon"><UploadCloud size={25}/></div>
              <strong>Choose a PDF file</strong>
              <span>Click to browse · Maximum 10 MB</span>
              <span className="file-type">PDF DOCUMENTS</span>
            </label>
            {busy && <div className="inline-status"><Loader2 className="spin" size={16}/> Working on your request…</div>}
            {status && <div className="success-message"><CheckCircle2 size={16}/><span>{status}</span></div>}
            {error && <div className="error-message">{error}</div>}
            {preview && <details className="preview"><summary>Preview extracted text</summary><p>{preview}</p></details>}
            <div className="note"><ShieldCheck size={17}/><span>Text-based PDFs only in this version. Scanned PDFs need OCR support.</span></div>
          </section>

          <section className="panel quiz-panel">
            <div className="section-heading"><div><div className="eyebrow">STEP 02</div><h2>Practice & learn</h2><p>Generate a quiz from your uploaded notes.</p></div><div className="heading-icon"><Brain size={22}/></div></div>
            <div className="question-setting"><label htmlFor="question-count">Number of questions</label><select id="question-count" value={count} onChange={e => setCount(Number(e.target.value))}><option value={3}>3 questions</option><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={15}>15 questions</option><option value={20}>20 questions</option></select></div>
            <button className="primary-button" disabled={!documentId || busy} onClick={generateQuiz}>{busy ? <Loader2 className="spin" size={17}/> : <Sparkles size={17}/>} Generate practice quiz</button>
            <div className="feature-list"><div><CheckCircle2 size={16}/> Source page references</div><div><CheckCircle2 size={16}/> Instant score and explanations</div><div><CheckCircle2 size={16}/> Saved attempt history</div></div>
            <div className="callout"><Sparkles size={17}/><p><strong>Study tip</strong><br/>Try answering from memory first, then review the explanation and original notes.</p></div>
          </section>
        </div>

        {questions.length > 0 && <section className="panel quiz-section">
          <div className="quiz-title-row"><div><div className="eyebrow">YOUR PRACTICE SESSION</div><h2>Quick knowledge check</h2><p>{questions.length} questions · From {documentName}</p></div><button className="ghost-button" onClick={resetQuiz}><RotateCcw size={15}/> Reset</button></div>
          {!results ? <>
            {questions.map((q, index) => <div className="question-card" key={q.id}><div className="question-number">QUESTION {String(index + 1).padStart(2, "0")} <span>PAGE {q.source_page}</span></div><h3>{q.question}</h3><div className="options">{q.options.map((option, i) => <label className={`option ${answers[q.id] === i ? "selected" : ""}`} key={`${q.id}-${i}`}><input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => setAnswers(prev => ({...prev, [q.id]: i}))}/><span className="option-letter">{String.fromCharCode(65+i)}</span>{option}</label>)}</div></div>)}
            <button className="primary-button submit-button" disabled={busy || Object.keys(answers).length !== questions.length} onClick={submitQuiz}>{busy ? <Loader2 className="spin" size={17}/> : <CheckCircle2 size={17}/>} Submit answers ({Object.keys(answers).length}/{questions.length})</button>
          </> : <div className="results-box"><div className="score-circle"><strong>{results.percentage}%</strong><span>YOUR SCORE</span></div><h3>{results.score} out of {results.total} correct</h3><p>Review the source sentence for each answer below.</p>{results.results.map((r: any, i: number) => { const q = questions.find(item => item.id === r.question_id); return <div className="result-row" key={r.question_id}><div className={`result-dot ${r.correct ? "correct" : "incorrect"}`}>{r.correct ? "✓" : "!"}</div><div><strong>Question {i+1}: {r.correct ? "Correct" : "Review this answer"}</strong><p>{r.explanation}</p><small>Source: page {r.source_page}</small></div></div>})}<button className="primary-button" onClick={resetQuiz}><RotateCcw size={16}/> Start another session</button></div>}
        </section>}

        <section className="panel history-panel"><div className="section-heading"><div><div className="eyebrow">KEEP MOVING FORWARD</div><h2>Recent study sessions</h2><p>Your latest quiz attempts are saved locally by the backend.</p></div><div className="heading-icon"><History size={22}/></div></div>{attempts.length === 0 ? <div className="empty-history"><div className="empty-icon"><History size={23}/></div><strong>Your learning journey starts here</strong><p>Complete your first quiz and your result will show up here.</p></div> : <div className="history-list">{attempts.map(a => <div className="history-item" key={a.id}><div className="history-file"><FileText size={18}/></div><div className="history-info"><strong>{a.document_name}</strong><span>{new Date(a.created_at + "Z").toLocaleString()}</span></div><div className="history-score">{a.score}/{a.total}<small>{Math.round(a.score/a.total*100)}%</small></div></div>)}</div>}</section>
        <footer>StudyPilot AI <span>•</span> Learn at your own pace <span>•</span> Built for curious minds</footer>
      </main>
    </div>
  );
}
