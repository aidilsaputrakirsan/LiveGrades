// URL dari Web App yang dihosting di Google Apps Script
const baseURL = 'https://script.google.com/macros/s/AKfycbwUi3QuDQE5s2HRMuoGJdjG346YAPiHcm5t1Lzx5h4PxKkcSAAUC1oTlPHyKzFs4sRQ/exec';

// Variabel global
let currentSheet = "DMJK"; // Sheet default (DMJK)
let previousData = [];
let gradeDistribution = {
  'A': 0, 'AB': 0, 'B': 0, 'BC': 0, 'C': 0, 'D': 0, 'E': 0
};
let updateCounter = 0;
let lastUpdateTime = new Date();
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit dalam milidetik

// Fungsi untuk memformat waktu terakhir update
function formatLastUpdate() {
  const now = new Date();
  const diff = Math.floor((now - lastUpdateTime) / 1000);
  
  if (diff < 5) {
    return "Just now";
  } else if (diff < 60) {
    return `${diff} seconds ago`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}

// Fungsi untuk mengupdate waktu terakhir update setiap detik
function updateLastUpdateTime() {
  document.getElementById('lastUpdateTime').textContent = formatLastUpdate();
}

// Fungsi untuk mengambil data nilai dari server
async function fetchGrades() {
  try {
    // Tampilkan loading state
    const tbody = document.getElementById('gradesTable').querySelector('tbody');
    if (updateCounter === 0) {
      tbody.innerHTML = `
        <tr class="loading-row">
          <td colspan="7">
            <div class="loading-animation">
              <div class="loading-circle"></div>
              <div class="loading-circle"></div>
              <div class="loading-circle"></div>
            </div>
            <div class="loading-text">Loading grades...</div>
          </td>
        </tr>
      `;
    }
    
    const response = await fetch(`${baseURL}?sheet=${currentSheet}`);
    const data = await response.json();
    
    // Setelah data berhasil dimuat, update tabel
    updateTable(data);
    
    // Reset dan hitung distribusi nilai
    calculateGradeDistribution(data);
    
    // Update timestamp
    lastUpdateTime = new Date();
    updateLastUpdateTime();
    
    // Tambahkan efek refresh
    const tableContainer = document.querySelector('.grades-table-container');
    tableContainer.classList.add('refreshed');
    setTimeout(() => tableContainer.classList.remove('refreshed'), 1000);
    
    // Increment update counter
    updateCounter++;
    
    // Animate sync icon
    const syncIcon = document.querySelector('.data-status .pulse-icon');
    syncIcon.classList.add('pulse-animation');
    setTimeout(() => syncIcon.classList.remove('pulse-animation'), 1000);
    
  } catch (error) {
    console.error('Error fetching grades:', error);
    const tbody = document.getElementById('gradesTable').querySelector('tbody');
    tbody.innerHTML = `
      <tr class="error-row">
        <td colspan="7">
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            Error fetching data. Please try again later.
          </div>
        </td>
      </tr>
    `;
  }
}

// Fungsi untuk memperbarui tabel dengan data baru
function updateTable(data) {
  const tbody = document.getElementById('gradesTable').querySelector('tbody');
  tbody.innerHTML = ''; // Bersihkan tabel sebelum update
  
  // Urutkan data berdasarkan nilai angka (dari tinggi ke rendah)
  data.sort((a, b) => parseInt(b.nilaiAngka) - parseInt(a.nilaiAngka));
  
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    
    // Set delay untuk animasi masuk
    tr.style.animationDelay = `${index * 0.05}s`;
    
    // Tambahkan kelas animasi jika data berubah
    const previousIndex = previousData.findIndex(item => item.nama === row.nama);
    let hasChanges = false;
    
    if (previousIndex !== -1) {
      const prev = previousData[previousIndex];
      if (prev.nilaiAngka !== row.nilaiAngka) {
        hasChanges = true;
        if (parseInt(prev.nilaiAngka) < parseInt(row.nilaiAngka)) {
          tr.classList.add('value-increased');
        } else if (parseInt(prev.nilaiAngka) > parseInt(row.nilaiAngka)) {
          tr.classList.add('value-decreased');
        }
      }
    }
    
    // Posisi dalam kelas
    const positionLabel = index === 0 ? 
      '<span class="position-badge top">Top</span>' : 
      (index < 3 ? `<span class="position-badge">Top ${index+1}</span>` : '');
    
    // Tentukan kelas berdasarkan nilai huruf
    let gradeClass = getGradeClass(row.nilaiHuruf);
    
    // Pembuat progress bar untuk nilai komponen
    const sikapBar = createProgressBar(row.sikap, 100, getProgressBarClass(row.sikap));
    const tugasBar = createProgressBar(row.tugas, 100, getProgressBarClass(row.tugas));
    const utsBar = createProgressBar(row.uts, 100, getProgressBarClass(row.uts));
    const finalProjectBar = createProgressBar(row.finalProject, 100, getProgressBarClass(row.finalProject));
    
    tr.innerHTML = `
      <td class="name-cell">
        <div class="name-content">
          ${positionLabel}
          <span class="student-name ${hasChanges ? 'highlight-change' : ''}">${row.nama}</span>
        </div>
      </td>
      <td class="component-cell">${sikapBar}</td>
      <td class="component-cell">${tugasBar}</td>
      <td class="component-cell">${utsBar}</td>
      <td class="component-cell">${finalProjectBar}</td>
      <td><div class="grade-numeric ${gradeClass}">${row.nilaiAngka}</div></td>
      <td><div class="grade-letter ${gradeClass}">${row.nilaiHuruf}</div></td>
    `;
    tbody.appendChild(tr);
  });
  
  previousData = JSON.parse(JSON.stringify(data));
}

// Fungsi untuk membuat progress bar
function createProgressBar(value, max, className) {
  const percentage = (parseFloat(value) / max) * 100;
  return `
    <div class="progress-container">
      <div class="progress-value">${value}</div>
      <div class="progress-bar">
        <div class="progress-fill ${className}" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

// Fungsi untuk mendapatkan kelas CSS berdasarkan nilai
function getProgressBarClass(value) {
  value = parseFloat(value);
  if (value >= 90) return 'excellent';
  if (value >= 80) return 'good';
  if (value >= 70) return 'average';
  if (value >= 60) return 'below-average';
  return 'poor';
}

// Fungsi untuk mendapatkan kelas CSS berdasarkan nilai huruf
function getGradeClass(grade) {
  switch (grade) {
    case 'A': return 'grade-A';
    case 'AB': return 'grade-AB';
    case 'B': return 'grade-B';
    case 'BC': return 'grade-BC';
    case 'C': return 'grade-C';
    case 'D': return 'grade-D';
    case 'E': return 'grade-E';
    default: return '';
  }
}

// Fungsi untuk menghitung distribusi nilai
function calculateGradeDistribution(data) {
  // Reset distribusi
  gradeDistribution = { 'A': 0, 'AB': 0, 'B': 0, 'BC': 0, 'C': 0, 'D': 0, 'E': 0 };
  
  // Hitung jumlah untuk setiap nilai huruf
  data.forEach(row => {
    if (gradeDistribution.hasOwnProperty(row.nilaiHuruf)) {
      gradeDistribution[row.nilaiHuruf]++;
    }
  });
  
  // Hitung total siswa
  const totalStudents = data.length;
  
  // Update elemen HTML untuk setiap nilai
  Object.keys(gradeDistribution).forEach(grade => {
    const count = gradeDistribution[grade];
    const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
    
    // Update counter
    const countElement = document.getElementById(`grade${grade}`);
    if (countElement) {
      countElement.textContent = count;
      
      // Animasi penghitung jika berubah
      if (countElement.dataset.previousValue && countElement.dataset.previousValue !== count.toString()) {
        countElement.classList.add('count-changed');
        setTimeout(() => countElement.classList.remove('count-changed'), 1000);
      }
      countElement.dataset.previousValue = count.toString();
    }
    
    // Update fill bar dengan animasi
    const fillElement = document.getElementById(`grade${grade}-count`);
    if (fillElement) {
      fillElement.style.width = `${percentage}%`;
    }
  });
}

// Tambahkan event listener untuk tombol pilihan Mata Kuliah
document.querySelectorAll(".course-selection button").forEach(button => {
  button.addEventListener("click", () => {
    currentSheet = button.getAttribute("data-sheet");
    
    // Reset update counter untuk menampilkan animasi loading lagi
    updateCounter = 0;
    
    // Perbarui tampilan tombol aktif
    document.querySelectorAll(".course-selection button").forEach(btn => {
      btn.classList.remove("active");
      btn.style.transform = "scale(1)";
    });
    
    button.classList.add("active");
    
    // Animasi tombol yang dipilih
    button.style.transform = "scale(1.05)";
    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 300);
    
    // Fetch data baru
    fetchGrades();
  });
});

// Update waktu terakhir refresh setiap detik
setInterval(updateLastUpdateTime, 1000);

// Inisialisasi
fetchGrades();

// Atur interval untuk mengambil data secara berkala setiap 5 menit
setInterval(fetchGrades, REFRESH_INTERVAL);

// Tambahkan kemampuan refresh manual dengan klik pada ikon sync
document.querySelector('.pulse-icon').addEventListener('click', () => {
  fetchGrades();
});