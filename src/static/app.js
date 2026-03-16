document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const message = document.getElementById("message");
  const toast = document.getElementById("toast");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and reset select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add a participants list for this activity
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";
        participantsSection.innerHTML = `<p><strong>Participants:</strong></p>`;

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.textContent = "No participants yet.";
          emptyItem.className = "participants-empty";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((email) => {
            const item = document.createElement("li");
            item.className = "participant-item";

            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            emailSpan.className = "participant-email";

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "participant-remove";
            removeBtn.title = "Remove participant";
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", () => {
              unregisterParticipant(name, email);
            });

            item.appendChild(emailSpan);
            item.appendChild(removeBtn);
            participantsList.appendChild(item);
          });
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Unregister a participant from an activity
  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.innerHTML = result.message;
        toast.className = "toast success show";
        fetchActivities();
      } else {
        toast.innerHTML = result.detail || "An error occurred";
        toast.className = "toast error show";
      }

      setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
      }, 5000);
    } catch (error) {
      toast.textContent = "Failed to remove participant. Please try again.";
      toast.className = "error show";
      console.error("Error removing participant:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.innerHTML = result.message;
        toast.className = "toast success show";
        signupForm.reset();

        // Refresh the activity list so participants update immediately
        await fetchActivities();
      } else {
        toast.innerHTML = result.detail || "An error occurred";
        toast.className = "toast error show";
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
      }, 5000);
    } catch (error) {
      toast.textContent = "Failed to sign up. Please try again.";
      toast.className = "toast error show";
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
