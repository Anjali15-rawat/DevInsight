"""Unit tests for the diff parser utility."""
import pytest
from app.utils.diff_parser import parse_unified_diff, FileDiff

SAMPLE_DIFF = """diff --git a/mfa_verify.go b/mfa_verify.go
index abc1234..def5678 100644
--- a/mfa_verify.go
+++ b/mfa_verify.go
@@ -120,8 +120,10 @@ func VerifyMFA(uid string) error {
 	db := getDB()
-	row := db.QueryRow("SELECT secret FROM users_mfa WHERE user_id = ?", uid)
+	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
+	defer cancel()
+	row := db.QueryRowContext(ctx, "SELECT secret FROM users_mfa WHERE user_id = ?", uid)
 	var secret string
 	if err := row.Scan(&secret); err != nil {
 		return err
 	}
"""


def test_parse_returns_file_diffs():
    result = parse_unified_diff(SAMPLE_DIFF)
    assert len(result) == 1
    assert result[0].file_path == "mfa_verify.go"


def test_parse_counts_additions():
    result = parse_unified_diff(SAMPLE_DIFF)
    assert result[0].additions == 3


def test_parse_counts_deletions():
    result = parse_unified_diff(SAMPLE_DIFF)
    assert result[0].deletions == 1


def test_parse_empty_diff():
    result = parse_unified_diff("")
    assert result == []


def test_parse_multiple_files():
    multi_diff = SAMPLE_DIFF + """
diff --git a/auth.py b/auth.py
index 111..222 100644
--- a/auth.py
+++ b/auth.py
@@ -10,3 +10,4 @@ def authenticate(user):
+    log.info("auth attempt")
     return check_password(user)
"""
    result = parse_unified_diff(multi_diff)
    assert len(result) == 2
    assert result[1].file_path == "auth.py"
