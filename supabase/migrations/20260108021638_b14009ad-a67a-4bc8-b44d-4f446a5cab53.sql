-- Criar trigger para numeração automática de sessões
DROP TRIGGER IF EXISTS trigger_assign_session_number ON appointments;

CREATE TRIGGER trigger_assign_session_number
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION assign_session_number();