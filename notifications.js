window.loadFeed = function () {
  const feedBox = document.getElementById("feedBox");
  if (!feedBox) return;

  const q = query(collection(db, "posts"), orderBy("time", "desc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const p = d.data();

      html += `
        <div class="post">
          <b>${p.user}</b>
          <div>${p.text}</div>
        </div>
      `;
    });

    feedBox.innerHTML = html;
  });
};