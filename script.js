// URL dari Web App yang dihosting di Google Apps Script
const baseURL = 'https://script.google.com/macros/s/AKfycbygHdCQ7406XwXTtvi72nqe_LKhdScDyOLc1k7QsLb8qCunhNU0S6_xNt07UO154BiY/exec';

// Variabel global
let currentSheet = "DMJK"; // Sheet default (DMJK)
let previousData = [];
let gradeDistribution = {
  'A': 0, 'AB': 0, 'B': 0, 'BC': 0, 'C': 0, 'D': 0, 'E': 0
};
let lastUpdateTime = new Date();
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit dalam milidetik
let gradeDistChart = null;
let componentChart = null;

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
  const syncButton = document.querySelector('.sync-button');
  syncButton.classList.add('rotating');
  
  try {
    // Tampilkan loading state untuk table view
    const tbody = document.getElementById('gradesTable').querySelector('tbody');
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
    
    // Tampilkan loading state untuk card view
    const cardsContainer = document.getElementById('gradesCards');
    cardsContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-animation">
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
        </div>
        <div class="loading-text">Loading grades...</div>
      </div>
    `;
    
    const response = await fetch(`${baseURL}?sheet=${currentSheet}`);
    const data = await response.json();
    
    // Setelah data berhasil dimuat, update tabel dan kartu
    updateTable(data);
    updateCards(data);
    
    // Update dashboard summary
    updateDashboardSummary(data);
    
    // Update charts
    updateCharts(data);
    
    // Reset dan hitung distribusi nilai
    calculateGradeDistribution(data);
    
    // Update timestamp
    lastUpdateTime = new Date();
    updateLastUpdateTime();
    
    // Tambahkan efek refresh
    const tableContainer = document.querySelector('.grades-table-container');
    tableContainer.classList.add('refreshed');
    setTimeout(() => tableContainer.classList.remove('refreshed'), 1000);
    
    previousData = JSON.parse(JSON.stringify(data));
    
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
    
    const cardsContainer = document.getElementById('gradesCards');
    cardsContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Error fetching data. Please try again later.
      </div>
    `;
  } finally {
    syncButton.classList.remove('rotating');
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
    
    // Tambahkan kelas animasi jika data berubah
    const previousIndex = previousData.findIndex(item => item.nama === row.nama);
    let hasChanges = false;
    
    if (previousIndex !== -1) {
      const prev = previousData[previousIndex];
      if (prev.nilaiAngka !== row.nilaiAngka) {
        hasChanges = true;
      }
    }
    
    // Posisi dalam kelas
    let positionLabel = '';
    if (index === 0) {
      positionLabel = '<span class="position-badge top">Top</span>';
    } else if (index === 1) {
      positionLabel = '<span class="position-badge top-2">Top 2</span>';
    } else if (index === 2) {
      positionLabel = '<span class="position-badge top-3">Top 3</span>';
    }
    
    // Tentukan kelas berdasarkan nilai huruf
    let gradeClass = `grade-${row.nilaiHuruf}`;
    
    // Pembuat progress bar untuk nilai komponen
    const sikapBar = createProgressBar(row.sikap, 100, getProgressBarClass(row.sikap));
    const tugasBar = createProgressBar(row.tugas, 100, getProgressBarClass(row.tugas));
    const utsBar = createProgressBar(row.uts, 100, getProgressBarClass(row.uts));
    const finalProjectBar = createProgressBar(row.finalProject, 100, getProgressBarClass(row.finalProject));
    
    tr.innerHTML = `
      <td>${positionLabel} ${row.nama}</td>
      <td>${sikapBar}</td>
      <td>${tugasBar}</td>
      <td>${utsBar}</td>
      <td>${finalProjectBar}</td>
      <td class="grade-value">${row.nilaiAngka}</td>
      <td class="${gradeClass}">${row.nilaiHuruf}</td>
    `;
    tbody.appendChild(tr);
    
    if (hasChanges) {
      tr.style.animation = "highlight 2s ease";
    }
  });
}

// Fungsi untuk memperbarui tampilan kartu dengan data baru
function updateCards(data) {
  const cardsContainer = document.getElementById('gradesCards');
  cardsContainer.innerHTML = ''; // Bersihkan container
  
  // Urutkan data berdasarkan nilai angka (dari tinggi ke rendah)
  data.sort((a, b) => parseInt(b.nilaiAngka) - parseInt(a.nilaiAngka));
  
  data.forEach((student, index) => {
    // Posisi dalam kelas
    let positionLabel = '';
    let positionClass = '';
    if (index === 0) {
      positionLabel = 'Top';
      positionClass = 'top';
    } else if (index === 1) {
      positionLabel = 'Top 2';
      positionClass = 'top-2';
    } else if (index === 2) {
      positionLabel = 'Top 3';
      positionClass = 'top-3';
    }
    
    // Tentukan kelas berdasarkan nilai huruf
    let gradeClass = `grade-${student.nilaiHuruf}`;
    
    const card = document.createElement('div');
    card.className = 'student-card';
    
    card.innerHTML = `
      <div class="student-card-header">
        <div class="student-name-container">
          ${positionLabel ? `<span class="position-badge ${positionClass}">${positionLabel}</span>` : ''}
          <h3>${student.nama}</h3>
        </div>
        <div class="grade-badge ${gradeClass}">${student.nilaiHuruf}</div>
      </div>
      <div class="student-card-body">
        <div class="component-row">
          <span class="component-label">Sikap & Kehadiran (20%)</span>
          <span class="component-value">${student.sikap}</span>
        </div>
        <div class="component-row">
          <span class="component-label">Tugas (50%)</span>
          <span class="component-value">${student.tugas}</span>
        </div>
        <div class="component-row">
          <span class="component-label">UTS (10%)</span>
          <span class="component-value">${student.uts}</span>
        </div>
        <div class="component-row">
          <span class="component-label">Final Project (20%)</span>
          <span class="component-value">${student.finalProject}</span>
        </div>
      </div>
      <div class="card-footer">
        <span>Nilai Akhir:</span>
        <span class="final-grade">${student.nilaiAngka}</span>
      </div>
    `;
    
    cardsContainer.appendChild(card);
  });
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

// Fungsi untuk update dashboard summary
function updateDashboardSummary(data) {
  // Total Students
  document.getElementById('totalStudents').textContent = data.length;
  
  // Top Score
  const topScore = data.length > 0 ? Math.max(...data.map(student => parseInt(student.nilaiAngka))) : 0;
  document.getElementById('topScore').textContent = topScore;
  
  // Average Score
  const totalScore = data.reduce((sum, student) => sum + parseInt(student.nilaiAngka), 0);
  const averageScore = data.length > 0 ? Math.round(totalScore / data.length) : 0;
  document.getElementById('averageScore').textContent = averageScore;
  
  // Passing Rate (nilai >= 66 = B)
  const passingStudents = data.filter(student => parseInt(student.nilaiAngka) >= 66).length;
  const passingRate = data.length > 0 ? Math.round((passingStudents / data.length) * 100) : 0;
  document.getElementById('passingRate').textContent = `${passingRate}%`;
}

// Fungsi untuk memperbarui Chart
function updateCharts(data) {
  // Grade Distribution Chart
  const gradeLabels = Object.keys(gradeDistribution);
  const gradeCounts = gradeLabels.map(grade => gradeDistribution[grade]);
  
  const gradeColors = {
    'A': '#10b981',
    'AB': '#84cc16',
    'B': '#06b6d4',
    'BC': '#eab308',
    'C': '#f97316',
    'D': '#ef4444',
    'E': '#dc2626'
  };
  
  const backgroundColors = gradeLabels.map(grade => gradeColors[grade]);
  
  const ctx1 = document.getElementById('gradeDistributionChart').getContext('2d');
  
  // Destroy previous chart if it exists
  if (gradeDistChart) {
    gradeDistChart.destroy();
  }
  
  gradeDistChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: gradeLabels,
      datasets: [{
        data: gradeCounts,
        backgroundColor: backgroundColors,
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#f1f5f9',
            font: {
              family: 'Poppins'
            }
          }
        },
        tooltip: {
          backgroundColor: '#334155',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          titleFont: {
            family: 'Poppins',
            size: 14
          },
          bodyFont: {
            family: 'Poppins'
          },
          displayColors: true,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Component Averages Chart
  const componentLabels = ['Sikap & Kehadiran', 'Tugas', 'UTS', 'Final Project'];
  const componentAverages = [
    calculateAverage(data, 'sikap'),
    calculateAverage(data, 'tugas'),
    calculateAverage(data, 'uts'),
    calculateAverage(data, 'finalProject')
  ];
  
  const ctx2 = document.getElementById('componentAveragesChart').getContext('2d');
  
  // Destroy previous chart if it exists
  if (componentChart) {
    componentChart.destroy();
  }
  
  componentChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: componentLabels,
      datasets: [{
        label: 'Average Score',
        data: componentAverages,
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',  // Sikap (Green)
          'rgba(59, 130, 246, 0.7)',  // Tugas (Blue)
          'rgba(245, 158, 11, 0.7)',  // UTS (Orange)
          'rgba(99, 102, 241, 0.7)'   // Final Project (Indigo)
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(99, 102, 241)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#cbd5e1'
          },
          grid: {
            color: 'rgba(71, 85, 105, 0.3)'
          }
        },
        x: {
          ticks: {
            color: '#cbd5e1'
          },
          grid: {
            color: 'rgba(71, 85, 105, 0.3)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#334155',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          titleFont: {
            family: 'Poppins',
            size: 14
          },
          bodyFont: {
            family: 'Poppins'
          }
        }
      }
    }
  });
}

// Calculate average for component
function calculateAverage(data, component) {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, student) => {
    return acc + parseFloat(student[component]);
  }, 0);
  return Math.round(sum / data.length);
}

// Toggle between table view and card view
document.getElementById('tableViewBtn').addEventListener('click', function() {
  document.getElementById('tableView').style.display = 'block';
  document.getElementById('cardView').style.display = 'none';
  
  document.getElementById('tableViewBtn').classList.add('active');
  document.getElementById('cardViewBtn').classList.remove('active');
});

document.getElementById('cardViewBtn').addEventListener('click', function() {
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('cardView').style.display = 'block';
  
  document.getElementById('tableViewBtn').classList.remove('active');
  document.getElementById('cardViewBtn').classList.add('active');
});

// Tambahkan event listener untuk tombol pilihan Mata Kuliah
document.querySelectorAll(".course-selection button").forEach(button => {
  button.addEventListener("click", () => {
    currentSheet = button.getAttribute("data-sheet");
    
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

// Tambahkan event listener untuk refresh manual
document.querySelector('.sync-button').addEventListener('click', fetchGrades);

// Update waktu terakhir refresh setiap detik
setInterval(updateLastUpdateTime, 1000);

// Inisialisasi
fetchGrades();

// Atur interval untuk mengambil data secara berkala setiap 5 menit
setInterval(fetchGrades, REFRESH_INTERVAL);