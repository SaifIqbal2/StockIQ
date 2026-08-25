"""Tests for utilities and validators."""

import pytest
from src.utils.validators import StockValidator, DataValidator
from src.utils.helpers import NumericHelper, DateTimeHelper, DataHelper
from src.utils.exceptions import ValidationException, TickerNotFoundError


class TestStockValidator:
    """Test stock validators."""

    def test_validate_ticker_valid(self):
        """Test valid ticker validation."""
        assert StockValidator.validate_ticker('OGDC')

    def test_validate_ticker_invalid(self):
        """Test invalid ticker validation."""
        with pytest.raises(TickerNotFoundError):
            StockValidator.validate_ticker('INVALID')

    def test_validate_strategy_valid(self):
        """Test valid strategy validation."""
        assert StockValidator.validate_strategy('value')
        assert StockValidator.validate_strategy('growth')

    def test_validate_strategy_invalid(self):
        """Test invalid strategy validation."""
        from src.utils.exceptions import InvalidStrategyError
        with pytest.raises(InvalidStrategyError):
            StockValidator.validate_strategy('invalid_strategy')

    def test_validate_numeric_range(self):
        """Test numeric range validation."""
        assert StockValidator.validate_numeric_range(50, 0, 100)

    def test_validate_numeric_range_invalid(self):
        """Test invalid numeric range."""
        with pytest.raises(ValidationException):
            StockValidator.validate_numeric_range(150, 0, 100)

    def test_validate_email(self):
        """Test email validation."""
        assert StockValidator.validate_email('test@example.com')

    def test_validate_email_invalid(self):
        """Test invalid email."""
        with pytest.raises(ValidationException):
            StockValidator.validate_email('invalid-email')


class TestDataValidator:
    """Test data validators."""

    def test_validate_financial_data(self):
        """Test financial data validation."""
        data = {
            'company_id': 1,
            'fiscal_year': 2023,
            'revenue': 1000000,
            'net_income': 100000,
        }
        assert DataValidator.validate_financial_data(data)

    def test_validate_financial_data_missing_field(self):
        """Test financial data with missing field."""
        data = {
            'company_id': 1,
            'fiscal_year': 2023,
            # missing revenue
            'net_income': 100000,
        }
        with pytest.raises(ValidationException):
            DataValidator.validate_financial_data(data)


class TestNumericHelper:
    """Test numeric helpers."""

    def test_format_currency(self):
        """Test currency formatting."""
        result = NumericHelper.format_currency(1234.56)
        assert '1,234.56' in result or '1234.56' in result

    def test_format_percentage(self):
        """Test percentage formatting."""
        result = NumericHelper.format_percentage(0.25)
        assert '25' in result
        assert '%' in result

    def test_format_large_number(self):
        """Test large number formatting."""
        assert 'M' in NumericHelper.format_large_number(1000000)
        assert 'B' in NumericHelper.format_large_number(1000000000)
        assert 'K' in NumericHelper.format_large_number(1000)

    def test_safe_divide(self):
        """Test safe division."""
        assert NumericHelper.safe_divide(10, 2) == 5
        assert NumericHelper.safe_divide(10, 0) == 0
        assert NumericHelper.safe_divide(10, 0, default=999) == 999

    def test_calculate_cagr(self):
        """Test CAGR calculation."""
        cagr = NumericHelper.calculate_cagr(100, 200, 5)
        assert 0 < cagr < 1  # Should be positive and less than 100%

    def test_calculate_return(self):
        """Test return calculation."""
        ret = NumericHelper.calculate_return(100, 150)
        assert ret == 0.5  # 50% return


class TestDateTimeHelper:
    """Test datetime helpers."""

    def test_get_fiscal_year(self):
        """Test fiscal year calculation."""
        from datetime import datetime
        fy = DateTimeHelper.get_fiscal_year(datetime(2023, 6, 15))
        assert fy == 2023

    def test_get_fiscal_quarter(self):
        """Test fiscal quarter calculation."""
        from datetime import datetime
        q1 = DateTimeHelper.get_fiscal_quarter(datetime(2023, 1, 15))
        assert 'Q1' in q1

        q2 = DateTimeHelper.get_fiscal_quarter(datetime(2023, 4, 15))
        assert 'Q2' in q2


class TestDataHelper:
    """Test data helpers."""

    def test_normalize_dict_keys(self):
        """Test dictionary key normalization."""
        data = {'Name': 'Test', 'Value': 100}
        result = DataHelper.normalize_dict_keys(data)
        assert 'name' in result
        assert 'value' in result

    def test_flatten_dict(self):
        """Test dictionary flattening."""
        data = {'user': {'name': 'Test', 'age': 30}}
        result = DataHelper.flatten_dict(data)
        assert 'user_name' in result
        assert 'user_age' in result

    def test_merge_dicts(self):
        """Test dictionary merging."""
        d1 = {'a': 1, 'b': 2}
        d2 = {'c': 3}
        result = DataHelper.merge_dicts(d1, d2)
        assert len(result) == 3
        assert result['a'] == 1
        assert result['c'] == 3

    def test_filter_dict(self):
        """Test dictionary filtering."""
        data = {'a': 1, 'b': 2, 'c': 3}
        result = DataHelper.filter_dict(data, ['a', 'c'])
        assert len(result) == 2
        assert 'b' not in result
