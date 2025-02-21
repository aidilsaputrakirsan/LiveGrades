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
    // Tambahkan kelas animasi jika data berubah
    if (previousData[index] && JSON.stringify(previousData[index]) !== JSON.stringify(row)) {
      tr.classList.add('updated');
    }
    
    // Tentukan kelas berdasarkan nilai huruf
    let gradeClass = '';
    switch (row.nilaiHuruf) {
      case 'A': gradeClass = 'grade-A'; break;
      case 'AB': gradeClass = 'grade-AB'; break;
      case 'B': gradeClass = 'grade-B'; break;
      case 'BC': gradeClass = 'grade-BC'; break;
      case 'C': gradeClass = 'grade-C'; break;
      case 'D': gradeClass = 'grade-D'; break;
      case 'E': gradeClass = 'grade-E'; break;
      default: gradeClass = '';
    }
    
    tr.innerHTML = `
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.sikap}</td>
      <td>${row.tugas}</td>
      <td>${row.uts}</td>
      <td>${row.finalProject}</td>
      <td class="grade-cell ${gradeClass}">${row.nilaiAngka}</td>
      <td class="grade-cell ${gradeClass}">${row.nilaiHuruf}</td>
    `;
    tbody.appendChild(tr);
  });
  previousData = data;
}

// Ambil data pertama kali dan lakukan polling setiap 10 detik
fetchGrades();
setInterval(fetchGrades, 10000);
