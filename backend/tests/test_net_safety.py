import pytest
from app.utils.net_safety import SSRFBlockedError, validate_url_safety


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/admin",
        "http://127.0.0.1:8080/test",
        "http://localhost/test",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "http://10.0.0.1/",
        "http://192.168.1.1/",
        "http://172.16.0.1/",
        "ftp://example.com/test.apk",
        "file:///etc/passwd",
    ],
)
def test_ssrf_blocks_private_and_disallowed_urls(url: str) -> None:
    with pytest.raises(SSRFBlockedError):
        validate_url_safety(url)
