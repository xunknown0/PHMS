document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------
   * SEARCH + PAGINATION
   * ---------------------------------------- */
  const searchInput = document.getElementById('ownerSearch');
  const tableBody = document.querySelector('#ownersTable tbody');
  const rows = tableBody ? Array.from(tableBody.querySelectorAll('tr:not(#noRecordsRow)')) : [];
  const pagination = document.getElementById('pagination');
  const recordCountDisplay = document.getElementById('recordCountDisplay');
  const noRecordsRow = document.getElementById('noRecordsRow');
  const rowsPerPage = 10;

  function renderPage(page = 1, filteredRows = rows) {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    // Hide all rows first
    rows.forEach(r => r.style.display = 'none');

    // Show current page rows
    for (let i = start; i < end && i < filteredRows.length; i++) {
      filteredRows[i].style.display = '';
    }

    // No records message
    if (filteredRows.length === 0) {
      if (noRecordsRow) noRecordsRow.style.display = '';
    } else if (noRecordsRow) {
      noRecordsRow.style.display = 'none';
    }

    // Pagination buttons
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = 'page-item' + (i === page ? ' active' : '');

      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.innerText = i;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        renderPage(i, filteredRows);
      });

      li.appendChild(a);
      pagination.appendChild(li);
    }

    recordCountDisplay.innerText = `Displaying ${filteredRows.length} records`;
  }

  // Live search listener
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const term = this.value.toLowerCase().trim();
      const filtered = rows.filter(r => r.innerText.toLowerCase().includes(term));
      renderPage(1, filtered);
    });
  }

  // Initial render
  if (rows.length > 0) {
    renderPage();
  }



  /* ----------------------------------------
   * EDIT MODAL
   * ---------------------------------------- */
  const editModalEl = document.getElementById('editOwnerModal');
  if (editModalEl) {
    const editModal = new bootstrap.Modal(editModalEl);

    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('editFirstName').value = btn.dataset.firstname;
        document.getElementById('editLastName').value = btn.dataset.lastname;
        document.getElementById('editEmail').value = btn.dataset.email;
        document.getElementById('editPhone').value = btn.dataset.phone;
        document.getElementById('editAddress').value = btn.dataset.address;

        document.getElementById('editOwnerForm').action =
          `/owners/${btn.dataset.id}?_method=PUT`;

        editModal.show();
      });
    });
  }



  /* ----------------------------------------
   * SUCCESS TOAST MESSAGE
   * ---------------------------------------- */
  const flashDataEl = document.getElementById('flash-data');
  const successMsg = flashDataEl?.dataset.success || "";
  const toastContainer = document.getElementById('toast-container');

  if (successMsg && successMsg.trim().length > 0) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-success border-0 mb-2';
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${successMsg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"></button>
      </div>
    `;

    toastContainer.appendChild(toast);
    new bootstrap.Toast(toast, { delay: 3000 }).show();
  }

});

document.querySelectorAll(".viewOwnerBtn").forEach(btn => {
  btn.addEventListener("click", () => {

    document.getElementById("viewOwnerName").innerText =
      btn.dataset.firstname + " " + btn.dataset.lastname;

    document.getElementById("viewOwnerEmail").innerText = btn.dataset.email || "-";
    document.getElementById("viewOwnerPhone").innerText = btn.dataset.phone || "-";
    document.getElementById("viewOwnerPhone2").innerText = btn.dataset.phone || "-";
    document.getElementById("viewOwnerAddress").innerText = btn.dataset.address || "-";

    document.getElementById("viewOwnerImage").src =
      btn.dataset.image || "/img/default-user.png";

    new bootstrap.Modal(document.getElementById("viewOwnerModal")).show();
  });
});


// NOTE: This script assumes you have jQuery loaded.
$(document).ready(function() {
    
    // --- Constants ---
    const DEFAULT_USER_IMAGE = "/images/owner_user.png";
    const DEFAULT_PET_IMAGE = "/images/default-pet.png";

    // 1. Image Error Handler: Fallback to default user image if the link is broken
    $("#viewOwnerImage").on("error", function () {
        $(this).attr("src", DEFAULT_USER_IMAGE);
    });

    // 2. Click Handler for View Owner Modal
    $(".viewOwnerBtn").on("click", function () {
        const $button = $(this);
        // Safely extract text data from the button's data attributes
        const imageFile = $button.data("image") ? $button.data("image").trim() : null;
        const ownerId = $button.data("id") || "#0000";
        
        // --- Populate Profile Header (Name, ID, Image) ---
        const ownerImageSrc = imageFile ? `/uploads/${imageFile}` : DEFAULT_USER_IMAGE;
        $("#viewOwnerImage").attr("src", ownerImageSrc);
        
        const fullName = `${$button.data("firstname") || ""} ${$button.data("lastname") || ""}`.trim();
        $("#viewOwnerName").text(fullName);
        $("#viewOwnerId").text(ownerId);
        
        // --- Populate Contact and Address Details ---
        $("#viewOwnerEmail").text($button.data("email") || "N/A");
        $("#viewOwnerPhone").text($button.data("phone") || "N/A");
        $("#viewOwnerPhone2").text($button.data("phone2") || "N/A");
        $("#viewOwnerAddress").text($button.data("address") || "Not Provided");
        
        // Set the ID for the Edit button action (in the view modal footer)
        $("#editOwnerButton").data("owner-id", ownerId); 

        // --- Pet List Population (Example/Placeholder Logic) ---
        const pets = $button.data("pets") || []; 
        const petsBox = $("#viewOwnerPets");
        petsBox.empty();

        if (!pets.length) {
            petsBox.html(`<div class="list-group-item border-0 text-muted fst-italic py-3">No pets currently registered under this owner.</div>`);
        } else {
            pets.forEach(pet => {
                const petImageSrc = pet.image || DEFAULT_PET_IMAGE;
                petsBox.append(`
                    <div class="list-group-item border-0 p-2 d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${petImageSrc}"
                                 class="pet-image border border-1 border-primary"
                                 data-default-src="${DEFAULT_PET_IMAGE}"
                                 style="width:40px;height:40px;object-fit:cover"
                                 alt="${pet.name || 'Pet'} Photo">
                            <div>
                                <div class="fw-semibold text-dark">${pet.name || 'Unnamed Pet'}</div>
                                <small class="text-muted">${pet.type || 'Unknown Type'}</small>
                            </div>
                        </div>
                        <span class="badge text-bg-primary">${pet.status || 'Active'}</span>
                    </div>
                `);
            });
            // Attach error listener for dynamically created pet images
            petsBox.find(".pet-image").on("error", function() {
                 $(this).attr("src", $(this).data("default-src"));
            });
        }
        
        // Show the modal
        $("#viewOwnerModal").modal("show");
    });

    // NOTE: The Edit button now works purely via Bootstrap attributes 
    // due to the fix in the EJS template, so no complex JS needed here.

});