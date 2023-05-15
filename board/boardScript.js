/**
 * This function is used to generate all available tasks 
 */
async function initialise() {
    await includeHTML(1);
    await setUserContacts();
    await renderTasks();
}

/**
 * This function will clear the board and render all elements inside tasks[] into the board
 */
async function renderTasks() {
    await getBackendTasks();
    empty('todoTask');
    empty('inProgressTask');
    empty('awaitingFeedbackTask');
    empty('doneTask');
    for (let i = 0; i < tasks.length; i++) {
        renderTask(i);
    }
}

/**
 * this function will check the screen width and will either open the add task popup or redirect to the addtask page
 */
async function openPopup() {
    if (window.innerWidth > 1000) {
        document.getElementById('tasks').classList.remove('d-none');
        document.getElementById('tasks').innerHTML = renderPopup();
        renderCategorys();
        renderAssignedTo('myAssignedDropdown');
        await downloadFromServer();
        limitDueDate();
        await setUserContacts();
        document.getElementById('fullscreenBackground').classList.remove('d-none');
    }
    else {
        window.location.replace("/Add-task/addtask.html");
    }
}

/**
 * This function is used to save your edited task.
 * @param {number} i this is the index of the task you edited
 */
async function saveEdit(i) {
    if (checkFormEdit()) {
        await saveTask(i);
        openTask(i);
    }
}

function checkFormEdit() {
    if (!inputTitle.value.trim()) {
        document.getElementById('validateTitle').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateTitle').innerHTML = '';
    } if (!inputDescription.value.trim()) {
        document.getElementById('validateDescription').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateDescription').innerHTML = '';
    } if (!inputDueDate.value) {
        document.getElementById('validateDueDate').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validateDueDate').innerHTML = '';
    } if (priorityClicked == 'unclicked') {
        document.getElementById('validatePrio').innerHTML = 'This field is required!';
    } else {
        document.getElementById('validatePrio').innerHTML = '';
    } if (currentAssigned.length > 0) {
        document.getElementById('validateAssigned').innerHTML = '';
    } else {
        document.getElementById('validateAssigned').innerHTML = 'This field is required!';
    } if (newCat == 1) {
        document.getElementById('validateCategory').innerHTML = "Please enter category and choose color!"
    }
    if (inputTitle.value.trim() != ""
        && inputDescription.value.trim() != ""
        && inputDueDate.value != ""
        && priorityClicked != 'unclicked'
        && currentAssigned.length) {
        return true;
    } else {
        return false;
    }
}

/**
 * this function is used to render a specific task
 * 
 * @param {number} i this is the index of the task you want to render
 */
function renderTask(i) {
    document.getElementById(tasks[i]['status']).innerHTML += generateTaskHTML(i);
    renderCategoryColor(i);
    renderSubtaskBar(i);
    renderPrio(i);
    renderAssignedContacts(i);
}

/**
 * This function gives the background color of the category field in the task
 * @param {number} i this is the index of the task of which you want to render the color of the category
 */
function renderCategoryColor(i) {
    document.getElementById(`category${i}`).style = `Background-color: ${tasks[i]['category']['color']};`;
}

/**
 * This function renders the subtaskbar of tasks[i]
 * @param {number} i this is the index of the task of which you want to render the subtaskbar
 */
function renderSubtaskBar(i) {
    if (subtasksAvailable(i)) {
        let subtaskTrack = document.getElementById(`subtaskTrack${i}`);
        let element = tasks[i]['subtasks'];
        let howmanyDone = 0;
        for (let j = 0; j < element.length; j++) {
            if (element[j]['done'] == true) {
                howmanyDone++;
            }
        }
        subtaskTrack.innerHTML = generateSubtaskHTML(i, howmanyDone);
        let barWidth = (howmanyDone / tasks[i]['subtasks'].length) * 100;
        document.getElementById(`subtaskProgress${i}`).style = `width: ${barWidth}%`;
    }
}

function subtasksAvailable(i) {
    return tasks[i]['subtasks'].length > 0;
}

/**
 * this function renders the little priority icon in the bottom right of your task
 * @param {number} i this is the index of the task of which you want to render the priority
 */
function renderPrio(i) {
    let contactPrio = document.getElementById(`contactPrio${i}`);
    contactPrio.innerHTML = renderContactPrioHTML(i);
}

/**
 * this function renders the contact bubbles in the tasks overview
 * @param {number} i index of task
 */
function renderAssignedContacts(i) {
    let toManyContacts = 1;
    for (let j = 0; j < tasks[i]['assignedTo'].length; j++) {
        if (j < 3) {
            let firstName = (tasks[i]['assignedTo'][j]['firstName']).charAt(0);
            let lastName = (tasks[i]['assignedTo'][j]['lastName']).charAt(0);
            document.getElementById(`assigned${i}`).innerHTML += /*html*/`
                <div class="contactBubble" id="bubble${j}${i}" style="background-color: ${tasks[i]['assignedTo'][j]['userColor']};">${firstName}${lastName}</div>
            `;
        } else {
            toManyContacts++;
            document.getElementById(`bubble2${i}`).innerHTML = /*html*/`
                <div class="contactBubble" style="background-color: #2a3647;">+${toManyContacts}</div>
            `;
        }
    }
}

/**
 * this function figures out which tasks is currently dragged
 * @param {number} i index of dragged task
 */
function startDragging(i) {
    currentDrag = i;
}

/**
 * this function allows the task to be droppend
 */
function allowDrop(ev) {
    ev.preventDefault();
}

/**
 * this function gives the dragged task a new status depending on where it is dropped
 * @param {string} status indicates the new status of the task (todo, done etc)
 */
async function moveTo(status) {
    tasks[currentDrag]['status'] = status;
    await setBackendTasks();
    renderTasks();
}

/**
 * this function shows the drop zone if the task is dragged over it
 * @param {string} id the id of the field over which the task is curently hovered
 */
function hoverDrop(id) {
    document.getElementById(id).classList.add('bg-hover');
}

/**
 * this function removes the drop zone if the task is dragged away
 * @param {string} id the id of the field over which the task is curently hovered
 */
function unHoverDrop(id) {
    document.getElementById(id).classList.remove('bg-hover');
}

/**
 * this function will tilt the task as long as it is dragged
 * @param {number} i index of task
 */
function tilt(i) {
    document.getElementById(`task${i}`).classList.add('tilt');
}

/**
 * this function will untilt the task upon drop
 * @param {number} i index of task
 */
function unTilt(i) {
    document.getElementById(`task${i}`).classList.remove('tilt');
}

/**
 * this function will render the tasks that are matching with your search
 */
function search() {
    let input = document.getElementById('searchInput').value;
    empty('todoTask');
    empty('inProgressTask');
    empty('awaitingFeedbackTask');
    empty('doneTask');
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i]['title'].includes(input) || tasks[i]['description'].includes(input)) {
            renderTask(i);
        }
    }
}

/**
 * this function opens the popup version of a task upon click
 * @param {number} i index of task
 */
function openTask(i) {
    document.getElementById('body').classList.add('overflow-none');
    let fullscreen = document.getElementById('FsTask');
    fullscreen.classList.remove('d-none');
    document.getElementById('fullscreenBackground').classList.remove('d-none');

    fullscreen.innerHTML = generateFullscreenTaskHTML(i);
    renderAssignedToFullscreen(i);
    generateSubtasksFsHTML(i);
    limitDueDate();
    index = i;
}



/**
 * this function generates the subtasks in the popup version of task
 * @param {number} i index of task
 */
function generateSubtasksFsHTML(i) {
    for (let j = 0; j < tasks[i]['subtasks'].length; j++) {
        if (tasks[i]['subtasks'][j]['done'] == false) {
            document.getElementById('subtasksFs').innerHTML += /*html*/`
            <div class="subtaskFs" onclick="tickSubtask(${i}, ${j})"><div class="tickBox"><img id="tick${j}" class="d-none" src="../img/tick.svg"></div><p class="marginLeft">${tasks[i]['subtasks'][j]['subtask']}</p></div>
        `;
        } else {
            document.getElementById('subtasksFs').innerHTML += /*html*/`
            <div class="subtaskFs"><div class="tickBox" onclick="tickSubtask(${i}, ${j})"><img id="tick${j}" src="../img/tick.svg"></div><p class="marginLeft">${tasks[i]['subtasks'][j]['subtask']}</p></div>
        `;
        }
    }
}

/**
 * this function lets you tick/untick a subtask inside the popup version of task
 * @param {number} i index of task
 * @param {number} j index of subtask
 */
async function tickSubtask(i, j) {
    if (tasks[i]['subtasks'][j]['done'] == false) {
        tasks[i]['subtasks'][j]['done'] = true;
        document.getElementById(`tick${j}`).classList.remove('d-none');
    }
    else {
        tasks[i]['subtasks'][j]['done'] = false;
        document.getElementById(`tick${j}`).classList.add('d-none');
    }
    await setBackendTasks();
    for (let y = 0; y < tasks.length; y++) {
        renderSubtaskBar(y);
    }
}

/**
 * this function renders assigned bubbles in the popup version of task
 * @param {number} i index of task
 */
function renderAssignedToFullscreen(i) {
    let assigned = document.getElementById('assigned');

    for (let j = 0; j < tasks[i]['assignedTo'].length; j++) {
        const element = tasks[i]['assignedTo'][j];
        assigned.innerHTML += generateAssignedHTML(element);
    }
}



/**
 * this function will switch from popup view to edit view so you can edit your tasks
 * @param {number} i index of task
 */
async function editTask(i) {
    let title = tasks[i]['title'];
    let description = tasks[i]['description'];
    let dueDate = tasks[i]['dueDate'];
    priorityClicked = tasks[i]['prio'];
    empty('FsTask');
    document.getElementById('FsTask').innerHTML = renderEditTaskHTML(i, title, description, dueDate);
    setPrioBackground(priorityClicked);
    await renderAssignedToEdit('myAssignedEditDropdown');
    await checkAssigned(i);
    await limitDueDate();
    await renderAssignedContactsEdit(i);
    index = i;
}



/**
 * this function will render the dropdown menu of the assigned contacts
 * @param {string} id this is the id of the dropdown menu div inside of which the assigend contacts are rendered
 */
async function renderAssignedToEdit(id) {
    await setUserContacts();
    document.getElementById(id).innerHTML = '';
    for (let i = 0; i < contactList.length; i++) {
        document.getElementById(id).innerHTML += `<a onclick="changeContact(${i})">${contactList[i]['firstName']} ${contactList[i]['lastName']}<img id="checkEdit${i}" src="../img/blackCircleOutline.png"></a>`;
    }
}

/**
 * this function will assign/unassign a contact upon clicking it
 * @param {number} i index of contact
 */
function changeContact(i) {
    currentAssigned = tasks[index]['assignedTo'];
    if (contactAlreadyAssignedEdit(i)) {
        document.getElementById(`checkEdit${i}`).src = '../img/blackCircleOutline.png';
        unAssignContactEdit(i);
    } else {
        currentAssigned.push(contactList[i]);
        // if (document.getElementById('dropdownInputAssigned')) {
        //     document.getElementById('dropdownInputAssigned').value = 'x';
        // }
        document.getElementById(`checkEdit${i}`).src = '../img/blackCircle.png';
    }
    renderAssignedContactsEdit();
    if (currentAssigned.length > 0) {
        document.getElementById('dropdownEditInputAssigned').value = 'x';
    }
    else {
        document.getElementById('dropdownEditInputAssigned').value = '';
    }
}

/**
 * this function checks which contacts are assigned to chosen task and will mark them in the dropdown list
 * @param {number} i index of task
 */
async function checkAssigned(i) {
    currentAssigned = [];
    await downloadFromServer();
    contactList = JSON.parse(backend.getItem('contactList')) || [];
    for (let j = 0; j < tasks[i]['assignedTo'].length; j++) {
        const contact = tasks[i]['assignedTo'][j];
        for (let y = 0; y < contactList.length; y++) {
            const element = contactList[y];
            if (element['firstName'] == contact['firstName'] && element['lastName'] == contact['lastName']) {
                document.getElementById(`checkEdit${y}`).src = '../img/blackCircle.png';
                currentAssigned.push(contact);
                break;
            } else {
                if (y == contactList.length - 1) {
                    tasks[i]['assignedTo'].splice(j, 1);
                }
            }
        }
    }
}

/**
 * this function will unassign a contact 
 * @param {number} i index of contactList
 */
function unAssignContactEdit(i) {
    let currentContact = contactList[i];

    for (let j = 0; j < currentAssigned.length; j++) {
        if (currentAssigned[j]['firstName'] == currentContact['firstName'] && currentAssigned[j]['lastName'] == currentContact['lastName']) {
            currentAssigned.splice(j, 1);
            if (currentAssigned.length == 0) {
                document.getElementById('dropdownEditInputAssigned').value = '';
            }
            break;
        }
    }
    renderAssignedContactsEdit();
}

/**
 * this function will return if the chosen contact is already marked in the dropdown as assigned
 * @param {number} i index of contact
 * @returns returns the source of the image which symbolizes the tickbox
 */
function contactAlreadyAssignedEdit(i) {
    return (document.getElementById(`checkEdit${i}`).src).endsWith('/img/blackCircle.png');
}

/**
 * thsi function renders the assigned contat bubbles in the edit view
 */
function renderAssignedContactsEdit() {
    empty('assignedContactsEdit');
    for (let y = 0; y < currentAssigned.length; y++) {
        const curAss = currentAssigned[y];
        document.getElementById('assignedContactsEdit').innerHTML += /*html */`            
            <div class="contactBubble" style="background-color: ${curAss['userColor']};">${(curAss['firstName']).charAt(0)}${(curAss['lastName']).charAt(0)}</div>
        `;
    }
}

/**
 * this function shows the priority that is clicked
 * @param {string} prio priority of task
 */
function changeColorEdit(prio) {
    if (priorityClicked == prio) {
        unclickPrio(prio);
    } else {
        setPrioBackground(prio);
    }
}

/**
 * this function will reset the priority if the current priority is clicked again
 * @param {string} prio priority of task
 */
function unclickPrio(prio) {
    document.getElementById(`${prio}Edit`).src = `../img/prio${prio}.svg`;
    document.getElementById(`${prio}-buttonEdit`).classList.remove(`bg-${prio}`);
    priorityClicked = 'unclicked';
    document.getElementById('inputPrioEdit').value = '';
}

/**
 * this function will set the color of the priority buttons appropriate to the current chosen prio
 * @param {string} prio priority of task
 */
function setPrioBackground(prio) {
    resetPrioButtonsEdit();

    priorityClicked = prio;

    document.getElementById(`${prio}Edit`).src = `../img/prio${prio}-white.svg`;
    document.getElementById(`${prio}-buttonEdit`).classList.add(`bg-${prio}`);
    document.getElementById('inputPrioEdit').value = 'x';
}

/**
 * this function will reset the prio buttons so no prio is clicked
 */
function resetPrioButtonsEdit() {
    let priorities = ['Urgent', 'Medium', 'Low'];
    for (let i = 0; i < priorities.length; i++) {
        document.getElementById(`${priorities[i]}Edit`).src = `../img/prio${priorities[i]}.svg`;
        document.getElementById(`${priorities[i]}-buttonEdit`).classList.remove(`bg-${priorities[i]}`);
    }
}

/**
 * when you finished your changes this function will save your edited task
 * @param {number} i index of task
 */
async function saveTask(i) {
    let title = document.getElementById('inputTitle');
    let description = document.getElementById('inputDescription');
    let dueDate = document.getElementById('inputDueDate');
    let status = tasks[i]['status'];
    let subtask = tasks[i]['subtasks'];
    let category = tasks[i]['category'];

    tasks[i] = {
        'title': title.value,
        'description': description.value,
        'category': category,
        'dueDate': dueDate.value,
        'subtasks': subtask,
        'status': status,
        'assignedTo': currentAssigned,
        'prio': priorityClicked
    };

    currentAssigned = [];
    priorityClicked = 'unclicked';
    await setBackendTasks();
    renderTasks();
}

/**
 * this function will delete a chosen task
 * @param {number} x index of task
 * @param {*} event 
 */
async function deleteTask(x) {
    tasks.splice(x, 1);
    await setBackendTasks();
    renderTasks();
}

async function moveTask(i, event) {
    event.stopPropagation();
    await renderTasks();
    currentDrag = i;
    document.getElementById(`task${i}`).innerHTML = /*html*/`
    <div class="moveDiv">
        <div onclick="stopProp(event); renderTasks()" class="dragEdit colorChanged" id="mobileDrag"></div>
        <div class="dragLinks">
            <h4>Move To:</h4>
            <div class="dragLink" onclick="stopProp(event); moveTo('todoTask')">Todo</div>
            <div class="dragLink" onclick="stopProp(event); moveTo('inProgressTask')">In progress</div>
            <div class="dragLink" onclick="stopProp(event); moveTo('awaitingFeedbackTask')">Awaiting Feedback</div>
            <div class="dragLink" onclick="stopProp(event); moveTo('doneTask')">Done</div>
        </div>
    </div>
    `;
}

function stopProp(event) {
    event.stopPropagation();
}