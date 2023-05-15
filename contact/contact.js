/**
 *loadContact
 */
async function loadContact() {
  await sortContacts();
  createContactRightSide();
  document.getElementById('contact').innerHTML = "";
  await downloadFromServer();
  contactList = JSON.parse(backend.getItem('contactList')) || [];
  renderContactList(contactList);
}

/**
 * renderContactList
 */
function renderContactList(contactList) {
  let currentLetter = "";
  let html = "";
  for (let i = 0; i < contactList.length; i++) {
    let contact = contactList[i];
    let firstLetter = contact.firstName[0];
    let result = createContactListSections(firstLetter, currentLetter, html);
    currentLetter = result.currentLetter;
    html = result.html;
    html = createContactListElements(i, contact, html);
  }
  document.getElementById('contactList').innerHTML = html;
}

/**
 * createContactListSections
 */
function createContactListSections(firstLetter, currentLetter, html) {
  if (firstLetter.toLowerCase() !== currentLetter.toLowerCase()) {
    currentLetter = firstLetter;
    html += /*html*/`
          <div class="contactListSide">
            <div class="alpphabetSorting">${firstLetter.toUpperCase()}</div>
            <span class="dividingBar"></span>
          </div>
        `;
  }
  return { currentLetter, html };
}

/**
 * createContactListElements
 */
function createContactListElements(i, contact, html) {
  html += /*html*/`
        <div class="contact" id="contact-${i}" onclick="loadContactInfo(${i})">
          <div id="picImg${i}" class="picImg" style="background-color: ${contact['userColor']}">${contact.firstName[0].charAt(0).toUpperCase()}${contact.lastName[0].charAt(0).toUpperCase()}</div>
          <div class="dataInfo">
            <div class="dataName">${contact.firstName} ${contact.lastName}</div>
            <div class="dataMail">${contact.email}</div>
          </div>
        </div>
      `;
  return html;
}

/**
 * createContactRightSide
 */
function createContactRightSide() {
  document.getElementById('contactRightSide').innerHTML = generatecreateContactRightSideHTML();
}

/**
 * loadContactInfo
 */
function loadContactInfo(i) {
  changeBackgroundColor();
  const firstNameInitial = contactList[i].firstName[0].toUpperCase();
  const lastNameInitial = contactList[i].lastName[0].toUpperCase();
  document.getElementById('contact').innerHTML = generateContactInfoHTML(i, contactList, firstNameInitial, lastNameInitial);
  document.getElementById('newContact').style.zIndex = '0';
  document.getElementById('containerRightSide').style.zIndex = '2';
  document.getElementById('contactDataContainer').style.zIndex = '3';
  document.getElementById('texttemplatesKanban').style.zIndex = '3';
  document.getElementById('contactList').style.zIndex = '2';
}

/**
* overlayAddContact
*/
function overlayAddContact() {
  document.getElementById('overlayAddContact').innerHTML = generateoverlayAddContactHTML();
  document.querySelector('.overlayAddContact').classList.add('show');
  document.getElementById('popUpContainer').classList.remove('d-none');
  document.getElementById('newContact').classList.add('d-none');
}

/**
 * overlayEditContact
 * * @param {string} i
 */
function overlayEditContact(i) {

  const firstNameInitial = contactList[i].firstName[0].toUpperCase();
  const lastNameInitial = contactList[i].lastName[0].toUpperCase();

  document.getElementById('overlayEditContact').innerHTML = generateoverlayEditContactHTML(i, contactList, firstNameInitial, lastNameInitial);
  document.getElementById('popUpContainer').classList.remove('d-none');
  document.querySelector('.overlayEditContact').classList.add('show');
  document.getElementById("nameEdit").value = `${contactList[i].firstName} ${contactList[i].lastName}`;
  document.getElementById("emailEdit").value = contactList[i]["email"];
  document.getElementById("telEdit").value = contactList[i]["phone"];
}

/**
 * Generates HTML code for contact information sorted by first name.
 * @param {Array} contactList - An array of contact objects.
 * @param {string} a.firstName - The first name of a contact object.
 * @param {string} b.firstName - The first name of another contact object.
 * @returns {string} HTML code for the contact information.
 */
async function sortContacts() {
  await downloadFromServer();
  contactList = await JSON.parse(backend.getItem('contactList')) || [];
  contactList.sort((a, b) => {
    if (a.firstName < b.firstName)
      return -1;

    if (a.firstName > b.firstName)
      return 1;

    return 0;
  });
  await backend.setItem('contactList', JSON.stringify(contactList));
}

/**
 * Generates HTML code for a sorted list of contacts.
 * @returns {string} HTML code for the contact list.
 */
async function sortContactsList() {
  await downloadFromServer();
  contactList = await JSON.parse(backend.getItem('contactList')) || [];
  await contactList.sort(function (a, b) {
    if (a.firstName < b.firstName)
      return -1;
    if (a.firstName > b.firstName)
      return 1;

    return 0;
  });
  await backend.setItem('contactList', JSON.stringify(contactList));
}

/**
 * Toggles the visibility of the "Add Contact" overlay.
 */
function overlayAddContactInfo() {
  let overlay = document.querySelector('.overlayAddContactInfo');
  if (!overlay) {
    loadContactInfo();
    overlay = document.querySelector('.overlayAddContactInfo');
  }
  if (overlay.classList.contains('show')) {
    overlay.classList.remove('show');
  } else
    overlay.classList.add('show');
}

/**
 * Changes the background color of the selected contact and removes the selection from the previous contact.
 */
function changeBackgroundColor() {
  let previousSelectedContact = document.querySelector(".selected");
  if (previousSelectedContact) {
    previousSelectedContact.classList.remove("selected");
  }
  event.currentTarget.classList.add("selected");
}

/**
 * Updates the background color of the logo overlay to the specified color.
 * @param {string} color - The new background color for the logo overlay.
 */
function updateSelectedColor(color) {
  const logoOverlay = document.querySelector(".logoOverlay");
  logoOverlay.style.backgroundColor = color;
}

/**
 * Saves the edited contact information and updates the contact list.
 */
async function saveEditContact() {
  let name = document.getElementById("nameEdit").value;
  let email = document.getElementById("emailEdit").value;
  let tel = document.getElementById("telEdit").value;
  let firstName = name.split(" ")[0];
  let lastName = name.split(" ")[1];
  firstName = firstName.charAt(0).toUpperCase() + (firstName).slice(1);

  if (!lastName) {
    alert("Please enter last name");
    return;
  }

  lastName = lastName.charAt(0).toUpperCase() + (lastName).slice(1);

  let updatedContact = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: tel,
    user: currentUser.email,
    userColor: getRandomColor()
  };

  const existingContactIndex = contactList.findIndex(contact =>
    (contact.firstName === updatedContact.firstName && contact.lastName === updatedContact.lastName) ||
    contact.email === updatedContact.email ||
    contact.phone === updatedContact.phone
  );

  await updateAssigned(existingContactIndex, updatedContact);

  contactList = contactList.map((contact, index) => {
    if (index === existingContactIndex) {
      return {
        ...contact,
        firstName: updatedContact.firstName,
        lastName: updatedContact.lastName,
        email: updatedContact.email,
        phone: updatedContact.phone,
      };
    }
    return contact;
  });

  await backend.setItem('contactList', JSON.stringify(contactList));
  await sortContactsList();
  closeOverlay();
  await loadContact();
}

/**
Saves a new contact to the contact list.
// */
async function saveContact() {
  if (checkFormAddContact()) {
    let Name = document.getElementById('nameAdd').value;
    let email = document.getElementById('emailAdd').value;
    let phone = document.getElementById('telAdd').value;

    let firstName = (Name.split(' ')[0]); let lastName = (Name.split(' ')[1]);

    firstName = firstName.charAt(0).toUpperCase() + (firstName).slice(1);

    lastName = lastName.charAt(0).toUpperCase() + (lastName).slice(1);

    let newContact = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      userColor: getRandomColor(),
      user: currentUser.email
    };

    contactList.push(newContact);
    await backend.setItem('contactList', JSON.stringify(contactList));
    closeOverlay();
    loadContact();
    closeAddContact();
  }
}

/**
Checks if all required form fields have been filled out correctly.
@return {boolean} Returns true if all required fields are valid, false otherwise.
*/
function checkFormAddContact() {
  if (!nameAdd.value.trim()) {
    document.getElementById('validateName').innerHTML = 'This field is required!';
  } else {
    document.getElementById('validateName').innerHTML = '';
  } if (!emailAdd.value.trim()) {
    document.getElementById('validateEmail').innerHTML = 'This field is required!';
  } else {
    document.getElementById('validateEmail').innerHTML = '';
  } if (!telAdd.value) {
    document.getElementById('validatePhone').innerHTML = 'This field is required!';
  } else {
    document.getElementById('validatePhone').innerHTML = '';
  }

  // if (titleField.value.trim() != ""
  //     && descriptionField.value.trim() != ""
  //     && dueDateField.value != ""
  //     && priorityClicked != 'unclicked'
  //     && assignedContacts.length > 0
  //     && currentCategory
  //     && newCat == 0) {
  //     return true;
  // } else {
  //     return false;
  // }
}

/**
Changes the background color of a contact image in the contact list.
@param {number} i - The index of the contact image to be colored.
*/
function colorContactList(i) {
  document.getElementById(`picImg${i}`).style = `backgroundcolor:${currentUser['color']}`;
}

/**
Deletes a contact from the contact list.
@param {number} i - The index of the contact to be deleted.
*/
async function deleteContact(i) {
  contactList.splice(i, 1); // Entfernt den Kontakt aus der Liste
  await backend.setItem('contactList', JSON.stringify(contactList)); // Aktualisiert die Kontaktliste in der Datenbank
  loadContact(); // Lädt die Kontaktliste neu
  contactClicked = null;
}

/**
Hides the add contact overlay and removes the pop-up container.
*/
function closeAddContact() {
  document.querySelector('.overlayAddContact').classList.remove('show');
  document.getElementById('popUpContainer').classList.add('d-none');
  document.getElementById('newContact').classList.remove('d-none');
}

/**
Hides the edit contact overlay and removes the pop-up container.
*/
function closeOverlay() {
  document.querySelector('.overlayEditContact').classList.remove('show');
  document.getElementById('popUpContainer').classList.add('d-none');
}

/**
Generates HTML code for displaying contact information and hides the contact form.
*/
function closeContactInfo() {
  loadContact();
  const closeInfoContainer = document.querySelector('.picAndData');
  closeInfoContainer.classList.add('slide-out');
  document.getElementById('newContact').classList.remove("d-none");
  document.getElementById('newContact').style.zIndex = 7;
  document.getElementById('texttemplatesKanban').style.zIndex = '0';
  document.getElementById('contactDataContainer').style.zIndex = '0';
  document.getElementById('containerRightSide').style.zIndex = '0';
  document.getElementById('contactList').style.zIndex = '4';
}