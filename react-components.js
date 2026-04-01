const PurityTest = () => {
  const [step, setStep] = React.useState('intro');
  const [answers, setAnswers] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const questions = [
    { text: "How often do you clean your device?", options: [{label:"After every use",score:10},{label:"Weekly",score:5},{label:"Rarely",score:0}] },
    { text: "What do you use for cleaning?", options: [{label:"Special formula 420/710",score:10},{label:"Iso + Salt",score:8},{label:"Just water",score:0}] },
    { text: "How often do you change the water?", options: [{label:"Every session",score:10},{label:"Daily",score:5},{label:"When it smells",score:0}] }
  ];
  const totalScore = answers.reduce((a,b) => a + b, 0);
  if (step === 'result') {
    let title, emoji, desc;
    if (totalScore >= 25) { title = "Purity Master"; emoji = "✨"; desc = "Perfect! Your lungs are thanking you."; }
    else if (totalScore >= 15) { title = "Clean Enthusiast"; emoji = "🧼"; desc = "Good habits, keep it up!"; }
    else { title = "Needs Care"; emoji = "🦠"; desc = "Time for a deep clean! Don't let biofilms ruin your session."; }
    return React.createElement('div', { className: "card", style: { padding: '36px', textAlign: 'center' } },
      React.createElement('div', { style: { fontSize: '3rem' } }, emoji),
      React.createElement('h3', null, title),
      React.createElement('div', { style: { fontSize: '32px', fontFamily: 'var(--font-display)', color: 'var(--accent)' } }, totalScore + '/30'),
      React.createElement('p', { style: { color: 'var(--text-secondary)' } }, desc),
      React.createElement('button', { className: "btn-primary", onClick: () => { setStep('intro'); setAnswers([]); setCurrent(0); setScore(0); } }, "Retake Test →")
    );
  }
  if (step === 'quiz') {
    const q = questions[current];
    const handleAnswer = (scoreVal) => {
      const newAnswers = [...answers, scoreVal];
      setAnswers(newAnswers);
      if (current + 1 < questions.length) setCurrent(current + 1);
      else setStep('result');
    };
    return React.createElement('div', { className: "card", style: { padding: '32px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--accent)' } },
        React.createElement('span', null, 'Q ' + (current+1) + ' / ' + questions.length),
        React.createElement('span', null, 'Score: ' + totalScore)
      ),
      React.createElement('h3', null, q.text),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' } }, 
        q.options.map((opt, i) => React.createElement('button', { key: i, className: "btn-ghost", style: { justifyContent: 'flex-start', width: '100%' }, onClick: () => handleAnswer(opt.score) }, opt.label))
      )
    );
  }
  return React.createElement('div', { className: "card", style: { padding: '36px', textAlign: 'center' } },
    React.createElement('div', { style: { fontSize: '3rem' } }, '🧼'),
    React.createElement('h3', { style: { fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent)' } }, 'PURITY TEST'),
    React.createElement('p', null, '3 quick questions to rate your glass hygiene.'),
    React.createElement('button', { className: "btn-primary", onClick: () => setStep('quiz') }, "Take the Test →")
  );
};

const SocialHub = () => {
  const socials = [
    { icon: '✈️', name: 'Telegram', url: 'https://t.me/donbongvn', color: '#2AABEE' },
    { icon: '📸', name: 'Instagram', url: 'https://instagram.com/donbongstore', color: '#E1306C' },
    { icon: '📘', name: 'Facebook', url: 'https://facebook.com/donbong', color: '#1877F2' },
    { icon: '🎵', name: 'TikTok', url: 'https://tiktok.com/@donbong', color: '#FE2C55' },
    { icon: '🐦', name: 'X', url: 'https://x.com/donbong', color: '#1DA1F2' },
    { icon: '💚', name: 'Zalo', url: 'https://zalo.me/donbong', color: '#0068FF' }
  ];
  return React.createElement('div', { className: "social-hub", style: { display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' } }, 
    socials.map(s => React.createElement('a', { key: s.name, href: s.url, target: '_blank', className: "card", style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textDecoration: 'none', transition: 'all 0.3s', width: '100px' }, onMouseEnter: e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = s.color; }, onMouseLeave: e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--card-border)'; } },
      React.createElement('div', { style: { fontSize: '2rem', marginBottom: '12px' } }, s.icon),
      React.createElement('div', { style: { fontFamily: 'var(--font-cond)', fontWeight: 700 } }, s.name)
    ))
  );
};

const AIConsultant = () => {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([{ role: 'bot', text: 'Hi! I am Don AI. Looking for something specific? (Try: "home", "travel", "gift", "clean")' }]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef(null);
  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const getBotReply = (userText) => {
    const text = userText.toLowerCase();
    if (text.includes('home') || text.includes('дом')) return "For home use, I recommend our tall Beaker Bongs with multi-percolation! 🏠 They offer smooth, cooled hits perfect for long sessions.";
    if (text.includes('travel') || text.includes('путешеств')) return "For travel, check out our Silicone Pipes or Mini Rigs. ✈️ They are shatterproof and super easy to clean.";
    if (text.includes('gift') || text.includes('подарок')) return "Looking for a gift? Our Gift Cards or Combo Sets (bong + grinder + cleaner) are perfect! 🎁";
    if (text.includes('clean') || text.includes('чистк')) return "For deep cleaning, Formula 420 is the best – 98% efficiency. Just soak for 1 minute and rinse. 🧼";
    return "I can help with that! Browse our catalog or ask me about home, travel, gifts, or cleaning.";
  };
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const reply = getBotReply(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setLoading(false);
    }, 600);
  };
  if (!open) {
    return React.createElement('div', { className: "fab-rnd", onClick: () => setOpen(true), style: { position: 'fixed', bottom: '28px', left: '28px', zIndex: 50, width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' } }, '🤖');
  }
  return React.createElement('div', { className: "card", style: { position: 'fixed', bottom: '90px', left: '28px', width: '320px', height: '420px', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid var(--accent)` } },
    React.createElement('div', { style: { background: 'var(--accent-dim)', padding: '16px', display: 'flex', justifyContent: 'space-between' } }, 
      React.createElement('h3', null, 'DON AI Consultant'),
      React.createElement('button', { onClick: () => setOpen(false), style: { background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '18px' } }, '✕')
    ),
    React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' } }, 
      messages.map((m, i) => React.createElement('div', { key: i, style: { alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)', padding: '10px 14px', borderRadius: '16px', color: m.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)' } }, m.text)),
      loading && React.createElement('div', { style: { alignSelf: 'flex-start', background: 'var(--surface)', padding: '8px 12px', borderRadius: '16px' } }, 'Typing...'),
      React.createElement('div', { ref: endRef })
    ),
    React.createElement('form', { onSubmit: sendMessage, style: { padding: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px' } }, 
      React.createElement('input', { type: 'text', value: input, onChange: e => setInput(e.target.value), placeholder: "Type your request...", style: { flex: 1, padding: '10px', borderRadius: '30px', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-primary)' } }),
      React.createElement('button', { type: 'submit', className: "btn-primary", style: { padding: '8px 16px' } }, '→')
    )
  );
};

if (document.getElementById('purityRoot')) {
  ReactDOM.createRoot(document.getElementById('purityRoot')).render(React.createElement(PurityTest));
}
if (document.getElementById('socialHubRoot')) {
  ReactDOM.createRoot(document.getElementById('socialHubRoot')).render(React.createElement(SocialHub));
}
if (document.getElementById('ai-consultant-root')) {
  ReactDOM.createRoot(document.getElementById('ai-consultant-root')).render(React.createElement(AIConsultant));
}