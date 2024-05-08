// Array com dados reais dos vídeos das aulas
const videos = [
  { id: 1, title: 'Kerigma: Apresentação', url: 'https://youtube.com/shorts/f_lYncL9Pfc', course: 'Kerigma' },
  { id: 2, title: 'Curso Básico Teologia: Aula 1', url: 'https://youtube.com/live/09DiyE7Nbbs', course: 'Curso Básico Teologia' },
  { id: 3, title: 'Curso Básico Teologia: Aula 2', url: 'https://youtube.com/live/57EGgnxCKwc', course: 'Curso Básico Teologia' },
  { id: 4, title: 'Curso Básico Teologia: Aula 3', url: 'https://youtube.com/live/5QdjAO-VPbc', course: 'Curso Básico Teologia' },
  { id: 5, title: 'Curso Básico Teologia: Aula 4', url: 'https://youtube.com/live/uFpppoWGwUQ', course: 'Curso Básico Teologia' },
  { id: 6, title: 'Curso Básico Teologia: Aula 5', url: 'https://youtube.com/live/4Ikg9vKS4ck', course: 'Curso Básico Teologia' },
  { id: 7, title: 'Curso Básico Teologia: Aula 6', url: 'https://youtube.com/live/bQ0R1GUgPHk', course: 'Curso Básico Teologia' },
  { id: 8, title: 'Curso Básico Teologia: Aula 7', url: 'https://youtube.com/live/ugGEY_mzpYg', course: 'Curso Básico Teologia' },
  { id: 9, title: 'Curso Básico Teologia: Aula 8', url: 'https://youtube.com/live/KeKkx54QJ6A', course: 'Curso Básico Teologia' },
  { id: 10, title: 'Curso Básico Teologia: Aula 9', url: 'https://youtu.be/y7ZJe7woLtQ', course: 'Curso Básico Teologia' },
  { id: 11, title: 'Curso Básico Teologia: Aula 10', url: 'https://youtube.com/live/nRgEtn7Vq5I', course: 'Curso Básico Teologia' },
  { id: 1, title: 'Obreiro Aprovado: Apresentação', url: 'https://youtube.com/shorts/f_lYncL9Pfc', course: 'Curso Básico Obreiro'}
  // Adicione aqui mais vídeos para outros cursos, se necessário
];

// Função para exibir os vídeos na página
function renderVideos() {
  const videosSection = document.getElementById('videos');

  // Limpa o conteúdo existente na seção de vídeos
  videosSection.innerHTML = '';

  // Organiza os vídeos por curso
  const courses = {};
  videos.forEach(video => {
      if (!courses[video.course]) {
          courses[video.course] = [];
      }
      courses[video.course].push(video);
  });

  // Itera sobre os cursos e cria um elemento para cada curso
  for (const course in courses) {
      const courseElement = document.createElement('div');
      courseElement.classList.add('course');
    
      // Cria um título para o curso
      const titleElement = document.createElement('h2');
      titleElement.textContent = course;
      courseElement.appendChild(titleElement);
    
      // Cria uma lista para os vídeos do curso
      const videosList = document.createElement('ul');
      videosList.classList.add('video-list');
      courses[course].forEach(video => {
          const videoItem = document.createElement('li');
          const videoLink = document.createElement('a');
          videoLink.textContent = video.title;
          videoLink.href = video.url;
          videoLink.target = "_blank"; // Abre o link em uma nova aba
          videoItem.appendChild(videoLink);
          videosList.appendChild(videoItem);
      });
      courseElement.appendChild(videosList);
    
      // Adiciona o curso à seção de vídeos
      videosSection.appendChild(courseElement);
  }
}

// Chama a função para renderizar os vídeos ao carregar a página
window.onload = function() {
  renderVideos();
  // Adicione animações ou outros efeitos aqui, se necessário
};
