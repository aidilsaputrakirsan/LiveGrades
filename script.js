// Ganti URL berikut dengan URL Web App dari Apps Script milikmu
const scriptURL = 'https://script.google.com/macros/s/AKfycbxj4AgUfyK6Bur3zNMQCgphk6UmwddBmsRWQrRgMr-ambYWDFtmcLYD9wn81SGPGQD3/exec';
let previousData = [];

async function fetchGrades() {
  try {
    const response = await fetch(scriptURL);
    const data = await response.json();
    updateTable(data);
  } catch (error) {
    console.error('Error fetching grades:', error);
  }
}

function updateTable(data) {
  const tbody = document.getElementById('gradesTable').querySelector('tbody');
  tbody.innerHTML = ''; // Bersihkan tabel sebelum update

  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    // Tambahkan kelas animasi jika ada perubahan data
    if (previousData[index] && JSON.stringify(previousData[index]) !== JSON.stringify(row)) {
      tr.classList.add('updated');
    }
    tr.innerHTML = `
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.sikap}</td>
      <td>${row.tugas}</td>
      <td>${row.uts}</td>
      <td>${row.finalProject}</td>
      <td class="grade-value">${row.nilaiAngka}</td>
      <td class="grade-letter">${row.nilaiHuruf}</td>
    `;
    tbody.appendChild(tr);
  });
  previousData = data;
}

// Ambil data pertama kali dan lakukan polling setiap 10 detik
fetchGrades();
setInterval(fetchGrades, 10000);
