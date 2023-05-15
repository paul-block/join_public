/**
 * this function will close dropdown menues if somewhere else is clicked
 * @param {*} event 
 */
window.onclick = function (event) {
    if (dropdownClicked(event)) {
        closeAllDropdowns();
    }
    dropClicked = false;
}

function closeAllDropdowns() {
    let collection = document.getElementsByClassName('dropdown-content');
    for (let i = 0; i < collection.length; i++) {
        collection[i].classList.add("d-none");
    }
}

/**
 * checks if a dropdown is clicked
 * @param {*} event 
 * @returns returns true if a dropdown is clicked
 */
function dropdownClicked(event) {
    return !event.target.matches('.dropbtn') && !dropClicked && !event.target.closest('.dropdown-content');
}

/**
 * this function gets the contactlist from backend
 */
async function setUserContacts() {
    await downloadFromServer();
    contactList = JSON.parse(backend.getItem('contactList')) || [];
}

/**
 * this function will call all nessecary functions that are used to initialize the add task page site
 */
async function initialiseATP() {
    await includeHTML(2);
    await renderCategorys();
    await renderAssignedTo('myAssignedDropdownATP');
    await limitDueDate();
    await setUserContacts();
    await getBackendTasks();
}

/**
 * this function blocks dates from the past in the date field
 */
function limitDueDate() {
    let today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < document.getElementsByName("dueDateField").length; i++) {
        document.getElementsByName("dueDateField")[i].setAttribute('min', today);
    }
}

/**
 * this function will close the popup
 */
async function closeFullscreen() {
    document.getElementById('tasks').classList.add('d-none');
    document.getElementById('fullscreenBackground').classList.add('d-none');
    document.getElementById('FsTask').classList.add('d-none');
    document.getElementById('body').classList.remove('overflow-none');
    currentAssigned = [];
    assignedContacts = [];
    await renderTasks();
}

/**
 * will check if there is a priority clicked and then create the task
 */
async function createTask() {
    if (checkForm()) {
        tasks[tasks.length] = {
            'title': titleField.value,
            'description': descriptionField.value,
            'category': categories[currentCategory],
            'dueDate': dueDateField.value,
            'subtasks': subtasks,
            'status': 'todoTask',
            'assignedTo': assignedContacts,
            'prio': priorityClicked
        };
        await setBackendTasks();
        if (window.location['pathname'] == '/Add-task/addtask.html') {

            window.location.href = "../board/boardIndex.html";
        }
        else {
            //clearAddTask();
            closeFullscreen();
            await renderTasks();
        }
        subtasks = [];
        currentAssigned = [];
        assignedContacts = [];
        currentCategory = null;
    }
}

/**
 * will change form category dropdown to enter new category field
 */
function newCategory() {
    document.getElementById('categoryDropdown').classList.add('d-none');
    document.getElementById('newCategory').classList.remove('d-none');
    document.getElementById('categoryColors').classList.remove('d-none');
    newCat = 1;
}

/**
 * will change back to the category dropdown
 */
async function reverseCategory() {
    document.getElementById('categoryDropdown').classList.remove('d-none');
    document.getElementById('newCategory').classList.add('d-none');
    document.getElementById('categoryColors').classList.add('d-none');
    newCat = 0;
}

/**
 * will create a new category upon clicking the tick
 */
async function addCustomCategory() {
    if (currentColor && document.getElementById('customCategory').value) {
        let newCategory = document.getElementById('customCategory').value;
        newCategory = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);;
        await reverseCategory();
        if (newCategory) {
            categories[categories.length] = {
                'name': newCategory,
                'color': currentColor
            };
            await setBackend();
        }
        chooseCategory(categories.length - 1);
        document.getElementById('validateCategory').classList.remove('redText');
        renderCategorys();
    }
    else {
        document.getElementById('validateCategory').innerHTML = "Please enter category and choose color!"
        document.getElementById('validateCategory').classList.add('redText');
    }
}

/**
 * will choose the category you clicked and display it
 * @param {number} i index of task
 */
async function chooseCategory(i) {
    await getBackend();
    document.getElementById('dropbtnCategory').innerHTML = categories[i]['name'] + `<input required onkeyup="clearInput('dropdownInputCategory')" class="dropdownInput" id="dropdownInputCategory"> <div class="categoryColor" style="background-color: ${categories[i]['color']}"></div>`;
    currentCategory = i;
    document.getElementById('dropdownInputCategory').value = 'x';
    let currentPage = window.location['pathname'];
    if (currentPage == '/Add-task/addtask.html') {
        document.getElementById('myDropdownATP').classList.add('d-none');
    }
}

/**
 * will get the categorys from backend
 */
async function getBackend() {
    await downloadFromServer();
    categories = JSON.parse(backend.getItem('categories')) || [];
    if (categories.length < 1) {
        categories = [
            {
                'name': 'Sales',
                'color': '#fc71ff'
            },
            {
                'name': 'Backoffice',
                'color': '#1fd7c1'
            },
            {
                'name': 'Media',
                'color': '#ffc701'
            },
            {
                'name': 'Design',
                'color': '#ff7a00'
            }
        ];
        setBackend();
    }
}

/**
 * saves the categorys into the backend
 */
async function setBackend() {
    await backend.setItem('categories', JSON.stringify(categories));
}

/**
 * will render categorys into dropdowns
 */
async function renderCategorys() {
    await downloadFromServer();
    await getBackend();
    if (window.location['pathname'] == '/Add-task/addtask.html') {
        id = 'myDropdownATP';
    }
    else {
        id = 'myDropdown';
    }
    document.getElementById(id).innerHTML = `<a onclick="newCategory()">New Category <div class="categoryColor" style="background-color: grey"></div></a>`;
    for (let i = 0; i < categories.length; i++) {
        document.getElementById(id).innerHTML += /*html*/`
            <a onclick="chooseCategory('${i}')">
                ${categories[i]['name']}
                <div class="categoryX">
                    <img onclick="deleteCategory(${i}, event)" src="../img/crossx.svg">
                    <div class="categoryColor" style="background-color: ${categories[i]['color']}"></div>
                </div>
            </a>
            `;
    }
}

/**
 * will delete clicked categorys
 * @param {number} i index of category
 * @param {*} event 
 */
async function deleteCategory(i, event) {
    event.stopPropagation();
    categories.splice(i, 1);
    await setBackend();
    renderCategorys();
}

/**
 *  renders the list of contacts inside dropdown
 * @param {string} id id of dropdown div
 */
async function renderAssignedTo(id) {
    await downloadFromServer();
    await setUserContacts();
    document.getElementById(id).innerHTML = '';
    for (let i = 0; i < contactList.length; i++) {
        document.getElementById(id).innerHTML += `<a onclick="chooseContact(${i})">${contactList[i]['firstName']} ${contactList[i]['lastName']}<img class="check" id="check${i}" src="../img/blackCircleOutline.png"></a>`;
    }
}

/**
 * pushes tasks in backend
 */
async function setBackendTasks() {
    let arrayAsText = JSON.stringify(tasks);
    await backend.setItem('tasks', arrayAsText);
}

/**
 * pulls tasks in backend
 */
async function getBackendTasks() {
    await downloadFromServer();
    let arrayAsText = backend.getItem('tasks');
    if (arrayAsText) {
        tasks = await JSON.parse(arrayAsText);
    }
}

/**
 * Var "PriorityClicked" = value for Tasks -> when array("Task") is ready, we push this value in.
 * @param {*} prio 
 */
function changeColor(prio) {
    if (priorityClicked == prio) {
        document.getElementById(`${prio}`).src = `../img/prio${prio}.svg`;
        document.getElementById(`${prio}-button`).classList.remove(`bg-${prio}`);
        priorityClicked = 'unclicked';
    } else {
        resetPrioButtons();
        priorityClicked = prio;
        document.getElementById(`${prio}`).src = `../img/prio${prio}-white.svg`;
        document.getElementById(`${prio}-button`).classList.add(`bg-${prio}`);
    }
}

/**
 * sets prio buttons to unclicked
 */
function resetPrioButtons() {
    let priorities = ['Urgent', 'Medium', 'Low'];
    for (let i = 0; i < priorities.length; i++) {
        document.getElementById(`${priorities[i]}`).src = `../img/prio${priorities[i]}.svg`;
        document.getElementById(`${priorities[i]}-button`).classList.remove(`bg-${priorities[i]}`);
    }
}

/**
Checks if all required form fields have been filled out correctly.
@return {boolean} Returns true if all required fields are valid, false otherwise.
*/
function checkForm() {
    if (!titleField.value.trim()) {
        document.getElementById('validateTitle').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateTitle').innerHTML = '';
    } if (!descriptionField.value.trim()) {
        document.getElementById('validateDescription').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateDescription').innerHTML = '';
    } if (!dueDateField.value) {
        document.getElementById('validateDueDate').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateDueDate').innerHTML = '';
    } if (priorityClicked == 'unclicked') {
        document.getElementById('validatePrio').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validatePrio').innerHTML = '';
    } if (assignedContacts.length > 0) {
        document.getElementById('validateAssigned').innerHTML = '';
    } else {
        document.getElementById('validateAssigned').innerHTML = 'This field is required!';
    } if (newCat == 1) {
        document.getElementById('validateCategory').innerHTML = "Please enter category and choose color!"
    } else {
        if (currentCategory) {
            document.getElementById('validateCategory').innerHTML = '';
        } else {
            document.getElementById('validateCategory').innerHTML = 'This field is required';
        }
    }
    if (titleField.value.trim() != ""
        && descriptionField.value.trim() != ""
        && dueDateField.value != ""
        && priorityClicked != 'unclicked'
        && assignedContacts.length > 0
        && currentCategory
        && newCat == 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * will add a subtask
 */
function addSubtask() {
    let input = document.getElementById('subtaskInput').value.trim();
    if (input.replace(/ /g, '')) {
        subtasks.push(
            {
                'subtask': input,
                'done': false
            }
        );
        document.getElementById('subtaskField').innerHTML += /*html*/`
        <span class="subtaskList" id="${subtasks.length - 1}">${input} <img onclick="deleteSubtask(${subtasks.length - 1})" src="../img/crossx.svg"></span>
    `;
    }
}

/**
 * will delete a created subtask
 * @param {string} id id of subtask div
 */
function deleteSubtask(id) {
    let subtask = document.getElementById(id);
    for (let i = 0; i < subtasks.length; i++) {
        if (subtask.innerHTML.startsWith(subtasks[i]['subtask'])) {
            subtasks.splice(i, 1);
        }
    }
    subtask.remove();
}

/**
 * will empty a div of certain id
 * @param {string} id id of div you want to clear
 */
function empty(id) {
    document.getElementById(id).innerHTML = '';
}

/**
 * will select a chosen color in new category field
 * @param {string} id id of the clicked color
 * @param {string} color hex code of chosen color
 */
function chooseColor(id, color) {
    for (let i = 1; i <= 6; i++) {
        document.getElementById(i).classList.remove('border');
    }
    document.getElementById(id).classList.add('border');
    currentColor = color;
}

/**
 * will show or hide the dropdown clicked in board
 * @param {string} id the id of clicked dropdown div
 */
async function showDropdown(id) {
    document.getElementById(id).classList.toggle("d-none");
    if (!document.getElementById(id).classList.contains("d-none")) {
        dropClicked = true;
    }
    if (id == 'myAssignedEditDropdown') {
        await renderAssignedToEdit('myAssignedEditDropdown');
        await checkAssigned(index);
        await limitDueDate();
    }
}

/**
 * will show or hide the dropdown clicked in add task page
 * @param {string} id the id of clicked dropdown div
 */
function showDropdownATP(id) {
    document.getElementById(id).classList.toggle("d-none");
    if (!document.getElementById(id).classList.contains("d-none")) {
        dropClicked = true;
    }
    if (id == 'myDropdownATP') {
        document.getElementById('myAssignedDropdownATP').classList.add("d-none");
    }
    else {
        document.getElementById('myDropdownATP').classList.add("d-none");
        addTaskRenderAssignedBubble();
    }
}

/**
 * will assign/unassign a clicked contact and show with a filled or unfilled circle in dropdown
 * @param {number} i index of contact in dropdown
 */
function chooseContact(i) {
    dropClicked = true;
    if (contactAlreadyAssigned(i)) {
        document.getElementById(`check${i}`).src = '../img/blackCircleOutline.png';
        unAssignContact(i);
    } else {
        assignedContacts.push(contactList[i]);
        document.getElementById(`check${i}`).src = '../img/blackCircle.png';
    }
    addTaskRenderAssignedBubble();
    dropClicked = false;
}

/**
 * will change the assigned contacts in a task upon editing the contact
 * @param {number} index index of contact
 * @param {json} newContact the edited contact
 */
async function updateAssigned(index, newContact) {
    await downloadFromServer();
    await getBackendTasks();
    let oldContact = contactList[index];

    for (let i = 0; i < tasks.length; i++) {
        const element1 = tasks[i];
        for (let y = 0; y < element1['assignedTo'].length; y++) {
            const element = element1['assignedTo'][y];
            if (oldContact.firstName == element.firstName && oldContact.lastName == element.lastName) {
                tasks[i]['assignedTo'][y] = newContact;
            }
        }
    }
    await setBackendTasks();
}

/**
 * will create the little bubbles with initials of the assigned contacts in the add task page
 */
function addTaskRenderAssignedBubble() {
    document.getElementById(`assignedAddTask`).innerHTML = '';
    let toManyContacts = 1;
    for (let j = 0; j < assignedContacts.length; j++) {
        if (j < 6) {
            let firstName = (assignedContacts[j]['firstName']).charAt(0);
            let lastName = (assignedContacts[j]['lastName']).charAt(0);
            document.getElementById(`assignedAddTask`).innerHTML += /*html*/`
                <div class="contactBubble" id="bubble${j}" style="background-color: ${assignedContacts[j]['userColor']};">${firstName}${lastName}</div>
            `;
        } else {
            toManyContacts++;
            document.getElementById(`bubble5`).innerHTML = /*html*/`
                <div class="contactBubble" style="background-color: #2a3647;">+${toManyContacts}</div>
            `;
        }
    }
}

/**
 * 
 * @param {number} i index of contact in dropdown
 * @returns if contact is already is assigned
 */
function contactAlreadyAssigned(i) {
    return (document.getElementById(`check${i}`).src).endsWith('/img/blackCircle.png');
}

/**
 * this function will unassign a contact 
 * @param {number} i index of contact list
 */
function unAssignContact(i) {
    let currentContact = contactList[i];

    for (let j = 0; j < assignedContacts.length; j++) {
        if (assignedContacts[j] == currentContact) {
            assignedContacts.splice(j, 1);
            if (assignedContacts.length == 0) {
                document.getElementById('dropdownInputAssigned').value = '';
            }
        }
    }
}

/**
 * @returns will return a random color from the array
 */
function getRandomColor() {
    let colors = ['#8aa4ff', '#ff0000', '#2ad300', '#ff8a00', '#e200be', '#0038ff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * will animate the delete popup
 * @param {number} i index of contact
 */
function deletePopUp(i) {
    document.getElementById('deleteBackground').classList.remove('d-none');
    setTimeout(() => {
        document.querySelector('.deletePopup').classList.add('show');
        contactClicked = i;
    }, 10);
}

/**
 * will animate the delete popup
 */
function closeDeletePopUp() {
    document.querySelector('.deletePopup').classList.remove('show');
    setTimeout(() => {
        document.getElementById('deleteBackground').classList.add('d-none');
        contactClicked = null;
    }, 750);
}