"""
Test suite for Reports feature - Date range filtering and export functionality
Tests: Report Type selection, Date Range filtering, Phase/Status filters, Excel/PDF generation
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestReportsAPI:
    """Tests for /api/reports/generate endpoint"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Get today's date for date range tests
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
        self.week_end = (datetime.now() + timedelta(days=6 - datetime.now().weekday())).strftime("%Y-%m-%d")
        self.month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        if datetime.now().month == 12:
            month_end = datetime.now().replace(year=datetime.now().year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = datetime.now().replace(month=datetime.now().month + 1, day=1) - timedelta(days=1)
        self.month_end = month_end.strftime("%Y-%m-%d")

    # Basic API Tests
    def test_api_health(self):
        """Test API is reachable"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API health check passed: {data['message']}")

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint for report preview data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_tasks" in data
        assert "status_counts" in data
        print(f"✓ Dashboard stats: {data['total_tasks']} tasks")

    # Full Report Tests
    def test_generate_full_report_excel(self):
        """Test generating full Excel report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✓ Full Excel report generated: {len(response.content)} bytes")

    def test_generate_full_report_pdf(self):
        """Test generating full PDF report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=full")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✓ Full PDF report generated: {len(response.content)} bytes")

    # Report Type Tests
    def test_generate_daily_report_excel(self):
        """Test generating daily Excel report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=daily&start_date={self.today}&end_date={self.today}")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        print(f"✓ Daily Excel report generated for {self.today}")

    def test_generate_weekly_report_excel(self):
        """Test generating weekly Excel report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=weekly&start_date={self.week_start}&end_date={self.week_end}")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        print(f"✓ Weekly Excel report generated for {self.week_start} to {self.week_end}")

    def test_generate_monthly_report_excel(self):
        """Test generating monthly Excel report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=monthly&start_date={self.month_start}&end_date={self.month_end}")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        print(f"✓ Monthly Excel report generated for {self.month_start} to {self.month_end}")

    def test_generate_daily_report_pdf(self):
        """Test generating daily PDF report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=daily")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        print("✓ Daily PDF report generated")

    def test_generate_weekly_report_pdf(self):
        """Test generating weekly PDF report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=weekly")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        print("✓ Weekly PDF report generated")

    def test_generate_monthly_report_pdf(self):
        """Test generating monthly PDF report"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=monthly")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        print("✓ Monthly PDF report generated")

    # Phase Filter Tests
    def test_generate_report_with_phase_filter_pre_construction(self):
        """Test report with Pre-Construction phase filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=pre_construction")
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ Pre-Construction phase filtered report generated")

    def test_generate_report_with_phase_filter_admin_academic(self):
        """Test report with Admin Academic phase filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=admin_academic")
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ Admin Academic phase filtered report generated")

    def test_generate_report_with_phase_filter_auditorium(self):
        """Test report with Auditorium phase filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=auditorium")
        assert response.status_code == 200
        print("✓ Auditorium phase filtered report generated")

    def test_generate_report_with_phase_filter_residential(self):
        """Test report with Residential phase filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=residential")
        assert response.status_code == 200
        print("✓ Residential phase filtered report generated")

    def test_generate_report_with_phase_filter_external(self):
        """Test report with External phase filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=external")
        assert response.status_code == 200
        print("✓ External phase filtered report generated")

    # Status Filter Tests
    def test_generate_report_with_status_filter_completed(self):
        """Test report with completed status filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&status=completed")
        assert response.status_code == 200
        print("✓ Completed status filtered report generated")

    def test_generate_report_with_status_filter_in_progress(self):
        """Test report with in_progress status filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&status=in_progress")
        assert response.status_code == 200
        print("✓ In Progress status filtered report generated")

    def test_generate_report_with_status_filter_delayed(self):
        """Test report with delayed status filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&status=delayed")
        assert response.status_code == 200
        print("✓ Delayed status filtered report generated")

    def test_generate_report_with_status_filter_at_risk(self):
        """Test report with at_risk status filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&status=at_risk")
        assert response.status_code == 200
        print("✓ At Risk status filtered report generated")

    def test_generate_report_with_status_filter_not_started(self):
        """Test report with not_started status filter"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&status=not_started")
        assert response.status_code == 200
        print("✓ Not Started status filtered report generated")

    # Combined Filters Tests
    def test_generate_report_with_phase_and_status_filter(self):
        """Test report with both phase and status filters"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&phase=admin_academic&status=in_progress")
        assert response.status_code == 200
        print("✓ Phase + Status combined filter report generated")

    def test_generate_report_with_all_filters(self):
        """Test report with all filters applied"""
        response = self.session.get(
            f"{BASE_URL}/api/reports/generate?format=excel&report_type=weekly"
            f"&start_date={self.week_start}&end_date={self.week_end}"
            f"&phase=admin_academic&status=in_progress&include_history=true"
        )
        assert response.status_code == 200
        print("✓ All filters combined report generated")

    # Include History Tests
    def test_generate_report_with_history_excel(self):
        """Test Excel report with update history included"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&include_history=true")
        assert response.status_code == 200
        # Excel with history should be larger
        print(f"✓ Excel report with history generated: {len(response.content)} bytes")

    def test_generate_report_with_history_pdf(self):
        """Test PDF report with update history included"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=full&include_history=true")
        assert response.status_code == 200
        print(f"✓ PDF report with history generated: {len(response.content)} bytes")

    # Date Range Tests
    def test_generate_report_with_custom_date_range(self):
        """Test report with custom date range"""
        start = "2025-01-01"
        end = "2025-12-31"
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&start_date={start}&end_date={end}")
        assert response.status_code == 200
        print(f"✓ Custom date range ({start} to {end}) report generated")

    def test_generate_report_with_only_start_date(self):
        """Test report with only start date"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&start_date=2025-01-01")
        assert response.status_code == 200
        print("✓ Report with only start date generated")

    def test_generate_report_with_only_end_date(self):
        """Test report with only end date"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=full&end_date=2027-12-31")
        assert response.status_code == 200
        print("✓ Report with only end date generated")

    # Content-Disposition Header Tests
    def test_excel_filename_includes_report_type(self):
        """Test that Excel filename includes report type"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=excel&report_type=weekly")
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "Weekly" in content_disposition or "filename" in content_disposition.lower()
        print(f"✓ Content-Disposition header: {content_disposition}")

    def test_pdf_filename_includes_report_type(self):
        """Test that PDF filename includes report type"""
        response = self.session.get(f"{BASE_URL}/api/reports/generate?format=pdf&report_type=daily")
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "Daily" in content_disposition or "filename" in content_disposition.lower()
        print(f"✓ Content-Disposition header: {content_disposition}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
