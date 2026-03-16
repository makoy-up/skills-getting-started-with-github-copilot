"""
Tests for the Mergington High School API (FastAPI application)

Uses pytest + FastAPI TestClient with Arrange-Act-Assert pattern.
Global in-memory state is reset between tests via deep copy.
"""

import copy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset app.activities to initial state before each test"""
    # Deep copy the original activities to avoid cross-test contamination
    original_activities = copy.deepcopy(activities)
    yield
    # Clear and restore activities after test completes
    activities.clear()
    activities.update(copy.deepcopy(original_activities))


def test_get_activities_returns_200_and_contains_known_activity(client):
    """
    Test that GET /activities returns 200 and contains a known activity.
    
    Arrange: Starting state already set up by fixture
    Act: Make GET request to /activities
    Assert: Status is 200 and response contains Chess Club
    """
    # Arrange
    known_activity = "Chess Club"
    
    # Act
    response = client.get("/activities")
    
    # Assert
    assert response.status_code == 200
    assert known_activity in response.json()
    assert "description" in response.json()[known_activity]
    assert "participants" in response.json()[known_activity]


def test_post_signup_adds_participant_and_appears_in_get(client):
    """
    Test that POST signup adds a participant and they appear in later GET.
    
    Arrange: Prepare new email and activity name
    Act: Sign up the participant, then GET activities
    Assert: Participant is in the participants list
    """
    # Arrange
    activity_name = "Chess Club"
    new_email = "newstudent@mergington.edu"
    
    # Act
    signup_response = client.post(
        f"/activities/{activity_name}/signup?email={new_email}"
    )
    get_response = client.get("/activities")
    
    # Assert
    assert signup_response.status_code == 200
    assert new_email in get_response.json()[activity_name]["participants"]


def test_post_signup_duplicate_returns_400_with_correct_error(client):
    """
    Test that POST signup with duplicate email returns 400 and correct error.
    
    Arrange: Use existing participant
    Act: Attempt to sign up with existing participant email
    Assert: Status is 400 and error message is correct
    """
    # Arrange
    activity_name = "Chess Club"
    existing_participant = "michael@mergington.edu"
    
    # Act
    response = client.post(
        f"/activities/{activity_name}/signup?email={existing_participant}"
    )
    
    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_delete_participant_removes_them_and_not_in_get(client):
    """
    Test that DELETE removes a participant and they no longer appear in GET.
    
    Arrange: Prepare activity and participant to remove
    Act: Delete the participant, then GET activities
    Assert: Participant is no longer in the participants list
    """
    # Arrange
    activity_name = "Programming Class"
    participant_to_remove = "emma@mergington.edu"
    
    # Act
    delete_response = client.delete(
        f"/activities/{activity_name}/participants?email={participant_to_remove}"
    )
    get_response = client.get("/activities")
    
    # Assert
    assert delete_response.status_code == 200
    assert participant_to_remove not in get_response.json()[activity_name]["participants"]


def test_delete_missing_participant_returns_404(client):
    """
    Test that DELETE with missing participant returns 404.
    
    Arrange: Prepare a non-existent participant email
    Act: Attempt to delete non-existent participant
    Assert: Status is 404 and error message indicates participant not found
    """
    # Arrange
    activity_name = "Soccer Team"
    nonexistent_email = "ghoststudent@mergington.edu"
    
    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants?email={nonexistent_email}"
    )
    
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
