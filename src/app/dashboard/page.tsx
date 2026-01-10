// Add useState ideas=[], isStreaming=false
// Button onClick: fetch('/api/ideas/generate', {method:'POST', body:JSON.stringify(form)}).then(async res => {
  const reader = res.body.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    // Parse SSE data: [data: {...}]
    // Append to ideas[] → typewriter effect (e.g., setTimeout char-by-char)
  }
})
// Render: {ideas.map((idea, i) => <IdeaCard key={i} partial={idea.partial} />)}
// Typewriter: <div>{partialText}</div>