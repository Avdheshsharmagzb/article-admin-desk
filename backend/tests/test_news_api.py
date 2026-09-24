"""Backend tests for Newsroom Admin API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://article-admin-desk.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

VALID_STATUSES = [
    "Pending_Review",
    "Approved_For_Rewrite",
    "Rewritten_Pending_Publish",
    "Published",
]


@pytest.fixture(scope="module", autouse=True)
def reseed():
    # Reset to seed state before running tests
    r = requests.post(f"{API}/news/seed", params={"force": "true"}, timeout=30)
    assert r.status_code == 200, r.text
    yield
    requests.post(f"{API}/news/seed", params={"force": "true"}, timeout=30)


# ---------- Stats ----------
def test_stats_counts():
    r = requests.get(f"{API}/news/stats", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for s in VALID_STATUSES:
        assert s in data
    assert data["Pending_Review"] == 2
    assert data["Approved_For_Rewrite"] == 1
    assert data["Rewritten_Pending_Publish"] == 1
    assert data["Published"] == 1
    assert data["total"] == 5


# ---------- List / filter ----------
def test_list_all():
    r = requests.get(f"{API}/news", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) == 5


def test_list_filter_valid():
    r = requests.get(f"{API}/news", params={"status": "Pending_Review"}, timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 2
    assert all(i["status"] == "Pending_Review" for i in items)


def test_list_filter_invalid():
    r = requests.get(f"{API}/news", params={"status": "Bogus"}, timeout=15)
    assert r.status_code == 400


# ---------- Create ----------
def test_create_defaults_pending():
    payload = {
        "original_url": "https://example.com/test-article",
        "original_title": "TEST_ Article",
        "original_content": "Test content body",
        "media_url": "https://example.com/img.jpg",
        "media_type": "photo",
    }
    r = requests.post(f"{API}/news", json=payload, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "Pending_Review"
    assert data["original_title"] == "TEST_ Article"
    assert "id" in data
    # verify persisted
    g = requests.get(f"{API}/news/{data['id']}", timeout=15)
    assert g.status_code == 200
    assert g.json()["original_title"] == "TEST_ Article"
    requests.delete(f"{API}/news/{data['id']}", timeout=15)


# ---------- Patch rewritten ----------
def test_patch_rewrite_fields():
    items = requests.get(f"{API}/news", params={"status": "Approved_For_Rewrite"}, timeout=15).json()
    assert items, "expected at least one approved item"
    item_id = items[0]["id"]
    payload = {"rewritten_title": "New Title", "rewritten_content": "New content body."}
    r = requests.patch(f"{API}/news/{item_id}", json=payload, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["rewritten_title"] == "New Title"
    assert data["rewritten_content"] == "New content body."
    # Persistence
    g = requests.get(f"{API}/news/{item_id}", timeout=15).json()
    assert g["rewritten_title"] == "New Title"


# ---------- Status transitions ----------
def test_status_transitions_full():
    # Create fresh item
    payload = {
        "original_url": "https://example.com/flow",
        "original_title": "TEST_flow",
        "original_content": "content",
        "media_type": "photo",
    }
    item = requests.post(f"{API}/news", json=payload, timeout=15).json()
    iid = item["id"]

    for nxt in ["Approved_For_Rewrite", "Rewritten_Pending_Publish", "Published"]:
        r = requests.patch(f"{API}/news/{iid}/status", json={"status": nxt}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == nxt

    requests.delete(f"{API}/news/{iid}", timeout=15)


def test_status_invalid():
    items = requests.get(f"{API}/news", timeout=15).json()
    iid = items[0]["id"]
    r = requests.patch(f"{API}/news/{iid}/status", json={"status": "Nope"}, timeout=15)
    assert r.status_code == 400


def test_status_missing_id():
    r = requests.patch(f"{API}/news/nonexistent-id-123/status",
                       json={"status": "Published"}, timeout=15)
    assert r.status_code == 404


# ---------- Delete ----------
def test_delete_and_missing():
    payload = {
        "original_url": "https://example.com/del",
        "original_title": "TEST_del",
        "original_content": "x",
        "media_type": "photo",
    }
    item = requests.post(f"{API}/news", json=payload, timeout=15).json()
    r = requests.delete(f"{API}/news/{item['id']}", timeout=15)
    assert r.status_code == 200
    # Verify gone
    g = requests.get(f"{API}/news/{item['id']}", timeout=15)
    assert g.status_code == 404
    # Deleting again returns 404
    r2 = requests.delete(f"{API}/news/{item['id']}", timeout=15)
    assert r2.status_code == 404
