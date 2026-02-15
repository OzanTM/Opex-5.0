-- Create Materialized View for Monthly Suggestion Stats
CREATE MATERIALIZED VIEW monthly_suggestion_stats AS
SELECT
    DATE_TRUNC('month', created_at) AS month,
    company_id,
    department_id,
    COUNT(*) AS total_suggestions,
    COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected_count,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_count,
    SUM(estimated_savings) AS total_estimated_savings
FROM suggestions
GROUP BY 1, 2, 3
WITH DATA;

-- Create Index for Monthly Stats
CREATE UNIQUE INDEX idx_monthly_suggestion_stats ON monthly_suggestion_stats (month, company_id, department_id);

-- Create Materialized View for User Performance Stats
CREATE MATERIALIZED VIEW user_performance_stats AS
SELECT
    user_id,
    COUNT(*) AS total_suggestions,
    COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_count,
    SUM(estimated_savings) AS total_estimated_savings,
    MAX(created_at) AS last_suggestion_date
FROM suggestions
GROUP BY 1
WITH DATA;

-- Create Index for User Stats
CREATE UNIQUE INDEX idx_user_performance_stats ON user_performance_stats (user_id);
