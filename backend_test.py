#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ConstructOSAPITester:
    def __init__(self, base_url="https://project-pulse-277.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_get_test(self, name, endpoint, expected_status=200, expected_keys=None):
        """Run GET test"""
        try:
            url = f"{self.base_url}/api/{endpoint}"
            response = requests.get(url, timeout=10)
            
            if response.status_code != expected_status:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}
                
            data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            
            if expected_keys:
                missing_keys = [key for key in expected_keys if key not in data]
                if missing_keys:
                    self.log_result(name, False, f"Missing keys: {missing_keys}")
                    return False, data
                    
            self.log_result(name, True, f"Status: {response.status_code}")
            return True, data
        except Exception as e:
            self.log_result(name, False, str(e))
            return False, {}

    def run_put_test(self, name, endpoint, data, expected_status=200):
        """Run PUT test"""
        try:
            url = f"{self.base_url}/api/{endpoint}"
            response = requests.put(url, json=data, timeout=10)
            
            if response.status_code != expected_status:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}
                
            result_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            self.log_result(name, True, f"Status: {response.status_code}")
            return True, result_data
        except Exception as e:
            self.log_result(name, False, str(e))
            return False, {}

    def test_get_all_tasks(self):
        """Test GET /api/tasks - should return 138 tasks"""
        success, data = self.run_get_test("GET /api/tasks", "tasks")
        if success:
            task_count = len(data) if isinstance(data, list) else 0
            if task_count == 138:
                print(f"  ✓ Task count correct: {task_count}")
                return True, data
            else:
                print(f"  ✗ Expected 138 tasks, got {task_count}")
                return False, data
        return False, {}

    def test_dashboard_stats(self):
        """Test GET /api/dashboard/stats"""
        expected_keys = ['overall_progress', 'total_tasks', 'leaf_tasks', 'status_counts', 'phase_stats']
        success, data = self.run_get_test("GET /api/dashboard/stats", "dashboard/stats", 200, expected_keys)
        if success:
            print(f"  ✓ Overall progress: {data.get('overall_progress', 'N/A')}%")
            print(f"  ✓ Total tasks: {data.get('total_tasks', 'N/A')}")
            print(f"  ✓ Leaf tasks: {data.get('leaf_tasks', 'N/A')}")
            print(f"  ✓ Phase count: {len(data.get('phase_stats', []))}")
        return success, data

    def test_progress_update_leaf_task(self, task_id=20):
        """Test PUT /api/tasks/{id}/progress for leaf task"""
        new_progress = 75.0
        success, data = self.run_put_test(f"PUT /api/tasks/{task_id}/progress (leaf)", f"tasks/{task_id}/progress", {"progress": new_progress})
        if success and data.get('progress') == new_progress:
            print(f"  ✓ Task {task_id} updated to {new_progress}%")
            return True, data
        elif success:
            print(f"  ✗ Progress not updated correctly. Got {data.get('progress')}%, expected {new_progress}%")
            return False, data
        return False, {}

    def test_progress_update_non_leaf_task(self, task_id=14):
        """Test PUT /api/tasks/{id}/progress for non-leaf task (should fail)"""
        success, data = self.run_put_test(f"PUT /api/tasks/{task_id}/progress (non-leaf)", f"tasks/{task_id}/progress", {"progress": 50.0}, 400)
        return success, data

    def test_risk_flagging(self, task_id=25):
        """Test PUT /api/tasks/{id}/risk"""
        risk_data = {"risk_flagged": True, "risk_notes": "Test risk flagging"}
        success, data = self.run_put_test(f"PUT /api/tasks/{task_id}/risk", f"tasks/{task_id}/risk", risk_data)
        if success and data.get('risk_flagged') == True:
            print(f"  ✓ Task {task_id} flagged as at-risk")
            return True, data
        return False, {}

    def test_date_update(self, task_id=30):
        """Test PUT /api/tasks/{id}/dates"""
        date_data = {"start_date": "2026-01-15", "end_date": "2026-02-15"}
        success, data = self.run_put_test(f"PUT /api/tasks/{task_id}/dates", f"tasks/{task_id}/dates", date_data)
        if success and data.get('start_date') == date_data['start_date']:
            print(f"  ✓ Task {task_id} dates updated")
            return True, data
        return False, {}

    def test_excel_report_generation(self):
        """Test GET /api/reports/generate?format=excel"""
        try:
            url = f"{self.base_url}/api/reports/generate?format=excel"
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in content_type:
                    self.log_result("GET /api/reports/generate?format=excel", True, f"Excel file generated ({len(response.content)} bytes)")
                    return True, response.content
                else:
                    self.log_result("GET /api/reports/generate?format=excel", False, f"Wrong content type: {content_type}")
                    return False, None
            else:
                self.log_result("GET /api/reports/generate?format=excel", False, f"Status code: {response.status_code}")
                return False, None
        except Exception as e:
            self.log_result("GET /api/reports/generate?format=excel", False, str(e))
            return False, None

    def test_pdf_report_generation(self):
        """Test GET /api/reports/generate?format=pdf"""
        try:
            url = f"{self.base_url}/api/reports/generate?format=pdf"
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type:
                    self.log_result("GET /api/reports/generate?format=pdf", True, f"PDF file generated ({len(response.content)} bytes)")
                    return True, response.content
                else:
                    self.log_result("GET /api/reports/generate?format=pdf", False, f"Wrong content type: {content_type}")
                    return False, None
            else:
                self.log_result("GET /api/reports/generate?format=pdf", False, f"Status code: {response.status_code}")
                return False, None
        except Exception as e:
            self.log_result("GET /api/reports/generate?format=pdf", False, str(e))
            return False, None

    def test_progress_rollup(self):
        """Test progress rollup - update leaf task and verify parent rollup"""
        print("\n🔍 Testing Progress Rollup...")
        
        # First get task 16 (leaf) and its parent hierarchy
        success, tasks = self.run_get_test("Get tasks for rollup test", "tasks")
        if not success:
            return False
            
        task_16 = next((t for t in tasks if t['task_id'] == 16), None)
        if not task_16:
            print("  ❌ Task 16 not found")
            return False
            
        parent_15 = next((t for t in tasks if t['task_id'] == 15), None)
        parent_14 = next((t for t in tasks if t['task_id'] == 14), None)
        root_1 = next((t for t in tasks if t['task_id'] == 1), None)
        
        if not all([parent_15, parent_14, root_1]):
            print("  ❌ Parent tasks not found")
            return False
            
        print(f"  Before update - Task 16: {task_16['progress']}%, Parent 15: {parent_15['progress']}%")
        
        # Update task 16 progress
        new_progress = 80.0
        success, updated_task = self.run_put_test("Update task 16 progress", "tasks/16/progress", {"progress": new_progress})
        if not success:
            return False
            
        # Get updated parent tasks
        success, updated_tasks = self.run_get_test("Get updated tasks", "tasks")
        if not success:
            return False
            
        updated_parent_15 = next((t for t in updated_tasks if t['task_id'] == 15), None)
        updated_parent_14 = next((t for t in updated_tasks if t['task_id'] == 14), None)
        updated_root_1 = next((t for t in updated_tasks if t['task_id'] == 1), None)
        
        print(f"  After update - Task 16: {new_progress}%, Parent 15: {updated_parent_15['progress']}%")
        
        if updated_parent_15['progress'] != parent_15['progress']:
            print(f"  ✅ Progress rollup working - Parent 15 changed from {parent_15['progress']}% to {updated_parent_15['progress']}%")
            return True
        else:
            print(f"  ❌ Progress rollup failed - Parent 15 unchanged at {parent_15['progress']}%")
            return False

    def test_progress_update_with_notes(self, task_id=21):
        """Test PUT /api/tasks/{id}/progress with update_notes"""
        print(f"\n🔍 Testing Progress Update with Notes for Task {task_id}...")
        
        progress_data = {
            "progress": 65.0,
            "update_notes": "Test update with notes from automated testing"
        }
        success, data = self.run_put_test(f"PUT /api/tasks/{task_id}/progress with notes", f"tasks/{task_id}/progress", progress_data)
        if success and data.get('progress') == 65.0:
            print(f"  ✓ Task {task_id} updated to 65.0% with notes")
            return True, data
        return False, {}

    def test_task_history_endpoint(self, task_id=21):
        """Test GET /api/tasks/{id}/history"""
        print(f"\n🔍 Testing Task History Endpoint for Task {task_id}...")
        
        success, data = self.run_get_test(f"GET /api/tasks/{task_id}/history", f"tasks/{task_id}/history")
        if success and isinstance(data, list):
            print(f"  ✓ History retrieved: {len(data)} entries")
            if len(data) > 0:
                latest_entry = data[0]
                required_fields = ['task_id', 'action', 'field', 'old_value', 'new_value', 'timestamp']
                missing_fields = [f for f in required_fields if f not in latest_entry]
                if missing_fields:
                    print(f"  ❌ Missing required fields in history: {missing_fields}")
                    return False, data
                else:
                    print(f"  ✓ History entry structure correct: action={latest_entry.get('action')}, field={latest_entry.get('field')}")
            return True, data
        return False, {}

    def test_recent_history_endpoint(self):
        """Test GET /api/history/recent"""
        print(f"\n🔍 Testing Recent History Endpoint...")
        
        success, data = self.run_get_test("GET /api/history/recent", "history/recent?limit=10")
        if success and isinstance(data, list):
            print(f"  ✓ Recent history retrieved: {len(data)} entries")
            if len(data) > 0:
                latest_entry = data[0]
                required_fields = ['task_id', 'task_name', 'action', 'field', 'old_value', 'new_value', 'timestamp']
                missing_fields = [f for f in required_fields if f not in latest_entry]
                if missing_fields:
                    print(f"  ❌ Missing required fields in recent history: {missing_fields}")
                    return False, data
                else:
                    print(f"  ✓ Recent history entry structure correct with task_name: {latest_entry.get('task_name')}")
            return True, data
        return False, {}

    def test_date_change_history_logging(self, task_id=22):
        """Test that date changes are logged in history"""
        print(f"\n🔍 Testing Date Change History Logging for Task {task_id}...")
        
        # Get current history count
        success, history_before = self.run_get_test(f"Get history before date change", f"tasks/{task_id}/history")
        if not success:
            return False
            
        initial_count = len(history_before)
        
        # Update dates
        date_data = {
            "start_date": "2026-03-01", 
            "end_date": "2026-03-30",
            "update_notes": "Testing date change history logging"
        }
        success, _ = self.run_put_test(f"Update dates for task {task_id}", f"tasks/{task_id}/dates", date_data)
        if not success:
            return False
            
        # Check if history was logged
        success, history_after = self.run_get_test(f"Get history after date change", f"tasks/{task_id}/history")
        if success and len(history_after) > initial_count:
            print(f"  ✓ Date change logged: {initial_count} -> {len(history_after)} entries")
            return True, history_after
        else:
            print(f"  ❌ Date change not logged: {initial_count} -> {len(history_after)} entries")
            return False, {}

    def test_risk_change_history_logging(self, task_id=23):
        """Test that risk changes are logged in history"""
        print(f"\n🔍 Testing Risk Change History Logging for Task {task_id}...")
        
        # Get current history count
        success, history_before = self.run_get_test(f"Get history before risk change", f"tasks/{task_id}/history")
        if not success:
            return False
            
        initial_count = len(history_before)
        
        # Update risk
        risk_data = {
            "risk_flagged": True,
            "risk_notes": "Testing risk change history",
            "update_notes": "Risk flagged for automated testing"
        }
        success, _ = self.run_put_test(f"Update risk for task {task_id}", f"tasks/{task_id}/risk", risk_data)
        if not success:
            return False
            
        # Check if history was logged
        success, history_after = self.run_get_test(f"Get history after risk change", f"tasks/{task_id}/history")
        if success and len(history_after) > initial_count:
            print(f"  ✓ Risk change logged: {initial_count} -> {len(history_after)} entries")
            return True, history_after
        else:
            print(f"  ❌ Risk change not logged: {initial_count} -> {len(history_after)} entries")
            return False, {}

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting ConstructOS Backend API Tests")
        print("=" * 60)
        
        # Basic API tests
        self.test_get_all_tasks()
        self.test_dashboard_stats()
        
        # CRUD operations
        self.test_progress_update_leaf_task()
        self.test_progress_update_non_leaf_task()
        self.test_risk_flagging()
        self.test_date_update()
        
        # New history tracking tests
        self.test_progress_update_with_notes()
        self.test_task_history_endpoint()
        self.test_recent_history_endpoint()
        self.test_date_change_history_logging()
        self.test_risk_change_history_logging()
        
        # Report generation
        self.test_excel_report_generation()
        self.test_pdf_report_generation()
        
        # Advanced functionality
        self.test_progress_rollup()
        
        # Results summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        else:
            print("\n✅ All tests passed!")
            
        return self.tests_passed == self.tests_run

def main():
    tester = ConstructOSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())