// Data model: array of sections { name: string, tasks: [{ text, completed }] }
let data = JSON.parse(localStorage.getItem('todoData')) || [];

const sectionsContainer = document.getElementById('sections-container');
const addSectionBtn = document.getElementById('add-section-btn');
const newSectionInput = document.getElementById('new-section-input');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Load dark mode preference on page load
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode');
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
  } else {
    localStorage.setItem('darkMode', 'disabled');
  }
});

// Render all sections
function render() {
  sectionsContainer.innerHTML = '';
  data.forEach((section, sIndex) => {
    const secEl = document.createElement('div');
    secEl.className = 'section';
    secEl.innerHTML = `
      <div class="section-header">
        <h3>${section.name}</h3>
        <button class="delete-section-btn" title="Delete section">&times;</button>
      </div>
      <ul class="tasks" data-index="${sIndex}"></ul>
      <div class="add-task">
        <input type="text" placeholder="New task" />
        <button>Add</button>
      </div>
    `;
    sectionsContainer.appendChild(secEl);

    // Delete section
    const deleteSectionBtn = secEl.querySelector('.delete-section-btn');
    deleteSectionBtn.addEventListener('click', () => {
      if (confirm(`Delete section "${section.name}"?`)) {
        data.splice(sIndex, 1);
        saveData();
        render();
      }
    });

    const tasksUl = secEl.querySelector('.tasks');
    section.tasks.forEach((taskObj, tIndex) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.sIndex = sIndex;
      li.dataset.tIndex = tIndex;
      li.classList.toggle('completed', taskObj.completed);

      li.innerHTML = `
        <img class="checkbox" src="images/${taskObj.completed ? 'checked' : 'unchecked'}.png" />
        <span class="task-text">${taskObj.text}</span>
        <button class="delete-btn">&times;</button>
      `;

      tasksUl.appendChild(li);
      addDragEvents(li);
    });

    // Add task listener
    const addTaskBtn = secEl.querySelector('.add-task button');
    const taskInput = secEl.querySelector('.add-task input');
    addTaskBtn.addEventListener('click', () => {
      if (!taskInput.value.trim()) return;
      data[sIndex].tasks.push({ text: taskInput.value.trim(), completed: false });
      saveData();
      render();
    });

    // Handle task clicks (delete or checkbox)
    tasksUl.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const si = +li.dataset.sIndex;
      const ti = +li.dataset.tIndex;

      if (e.target.classList.contains('delete-btn')) {
        data[si].tasks.splice(ti, 1);
        saveData();
        render();
      }

      if (e.target.classList.contains('checkbox')) {
        data[si].tasks[ti].completed = !data[si].tasks[ti].completed;
        saveData();
        render();
      }
    });

    // Drag over for drop
    tasksUl.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterEl = getDragAfterElement(tasksUl, e.clientY);
      const dragging = document.querySelector('.dragging');
      if (afterEl == null) tasksUl.appendChild(dragging);
      else tasksUl.insertBefore(dragging, afterEl);
    });
  });
}

// Add Section
addSectionBtn.addEventListener('click', () => {
  const name = newSectionInput.value.trim();
  if (!name) return;
  data.push({ name, tasks: [] });
  newSectionInput.value = '';
  saveData();
  render();
});

// Drag events
function addDragEvents(el) {
  el.addEventListener('dragstart', () => {
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    updateDataFromDOM();
    saveData();
  });
}

// Helper: find element after drag position
function getDragAfterElement(container, y) {
  const nonDragEls = [...container.querySelectorAll('li:not(.dragging)')];
  return nonDragEls.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update `data` model to match DOM order
function updateDataFromDOM() {
  document.querySelectorAll('.tasks').forEach(tasksUl => {
    const sIdx = +tasksUl.dataset.index;
    data[sIdx].tasks = [...tasksUl.querySelectorAll('li')].map(li => ({
      text: li.querySelector('.task-text').textContent,
      completed: li.classList.contains('completed'),
    }));
  });
}

function saveData() {
  localStorage.setItem('todoData', JSON.stringify(data));
}

// Initial render
render();
