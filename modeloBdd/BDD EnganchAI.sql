--BORRAR TABLAS SI YA EXISTIAN
DROP TABLE CONFIGURACIONES;
DROP TABLE USUARIOS;
DROP TABLE SALAS;
DROP TABLE SECCIONES;
DROP TABLE SALAS_SECCIONES;
DROP TABLE ASIGNACIONES;
DROP TABLE METRICAS;

--CREAR TABLAS
CREATE  TABLE CONFIGURACIONES(
    IdConfiguracion NUMBER(5) PRIMARY KEY,
    Sensibilidad NUMBER(2) NOT NULL
);

CREATE TABLE USUARIOS(
    IdUsuario NUMBER(5) PRIMARY KEY,
    Nombre VARCHAR2(50) NOT NULL,
    Correo VARCHAR2(40) NOT NULL,
    Contrasenna VARCHAR2(72) NOT NULL,
    Avatar VARCHAR2(150),
    CONFIG_IdConfiguracion NUMBER(5),
    CONSTRAINT USUARIOS_CONFIGURACIONES_FK FOREIGN KEY (CONFIG_IdConfiguracion)
        REFERENCES CONFIGURACIONES(IdConfiguracion)
);

CREATE TABLE SALAS(
    IdSala NUMBER(5) PRIMARY KEY,
    Nombre VARCHAR2(10) NOT NULL,
    Link VARCHAR2(100) NOT NULL
);

CREATE TABLE SECCIONES(
    IdSeccion NUMBER(5) PRIMARY KEY,
    Nombre VARCHAR2(60) NOT NULL
);

CREATE TABLE SALAS_SECCIONES(
    SECCIONES_IdSeccion NUMBER(5),
    SALAS_IdSala NUMBER(5),
    PRIMARY KEY (SECCIONES_IdSeccion, SALAS_IdSala),
    CONSTRAINT SALAS_SECCIONES_SALAS_FK FOREIGN KEY (SALAS_IdSala)
        REFERENCES SALAS(IdSala),
    CONSTRAINT SALAS_SECCIONES_SECCIONES_FK FOREIGN KEY (SECCIONES_IdSeccion)
        REFERENCES SECCIONES(IdSeccion)
);

CREATE TABLE ASIGNACIONES (
    IdAsignacion NUMBER (5) PRIMARY KEY,
    USUARIOS_IdUsuario NUMBER(5),
    SALAS_SECCIONES_SECCIONES_IdSeccion NUMBER(5),
    SALAS_SECCIONES_SALAS_IdSala NUMBER(5),
    CONSTRAINT ASIGNACIONES_USUARIOS_FK FOREIGN KEY (USUARIOS_IdUsuario)
        REFERENCES USUARIOS(IdUsuario),
    CONSTRAINT ASIGNACIONES_SALAS_SECCIONES_FK FOREIGN KEY (SALAS_SECCIONES_SECCIONES_IdSeccion, SALAS_SECCIONES_SALAS_IdSala)
        REFERENCES SALAS_SECCIONES(SECCIONES_IdSeccion, SALAS_IdSala)
);

CREATE TABLE METRICAS (
    IdMetrica NUMBER(5) PRIMARY KEY,
    Registro CLOB NOT NULL,
    Promedio NUMBER(3) NOT NULL,
    Fecha DATE NOT NULL,
    ASIGNACIONES_IdAsignacion NUMBER(5),
    CONSTRAINT METRICAS_ASIGNACIONES_FK FOREIGN KEY (ASIGNACIONES_IdAsignacion)
        REFERENCES ASIGNACIONES(IdAsignacion)
);

--INDEX
CREATE INDEX USUARIOS_IDX ON USUARIOS (CONFIG_IdConfiguracion);

--CREAR SECUENCIAS PARA ASIGNAR IDS
CREATE SEQUENCE USUARIOS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE CONFIGURACIONES_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE METRICAS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SALAS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SECCIONES_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE ASIGNACIONES_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

--CREAR TRIGGERS

--ASIGNAR IDS AUTOMATICAS A LOS USUARIOS 
CREATE OR REPLACE TRIGGER TRG_USUARIOS_AUTO_ID
BEFORE INSERT ON USUARIOS
FOR EACH ROW
WHEN (NEW.IDUSUARIO IS NULL OR NEW.IDUSUARIO = 0)
DECLARE
    V_IDUSUARIO NUMBER(5);
    V_EXISTS NUMBER(5);--PARA VERIFICAR QUE LA ID EXISTE
BEGIN
    LOOP
        --OBTENER VALOR DE LA SECUENCIA
        SELECT USUARIOS_SEQ.NEXTVAL INTO V_IDUSUARIO FROM dual;
        --HACER UN COUNT PARA VER SI NEXTVAL YA EXISTE
        SELECT COUNT(*) INTO V_EXISTS FROM USUARIOS WHERE IDUSUARIO = V_IDUSUARIO;
        --SALIR DEL BUCLE SI LA NEXTVAL NO ESTA EN LA TABLA
        EXIT WHEN V_EXISTS = 0;
    END LOOP;
    --ASIGNAR LA NUEVA ID
    :NEW.IDUSUARIO := V_IDUSUARIO;
END;

--CREAR CONFIGURACIONES CUANDO SE INSERTA NUEVO USUARIO
CREATE OR REPLACE TRIGGER TRG_USUARIOS_INSERT_CONFIG
BEFORE INSERT ON USUARIOS
FOR EACH ROW
WHEN (NEW.CONFIG_IDCONFIGURACION = 0)
DECLARE
    V_IDCONFIGURACION NUMBER(5);--PARA ALMACENAR LA NUEVA ID
BEGIN
    --INSERTAR NUEVA FILA A CONFIGURACIONES
    INSERT INTO CONFIGURACIONES (IDCONFIGURACION, SENSIBILIDAD) VALUES (CONFIGURACIONES_SEQ.NEXTVAL, 30)--30=VALOR POR DEFECTO DE SENSIBILIDAD
    RETURNING IDCONFIGURACION INTO V_IDCONFIGURACION;
    --ASIGNAR LA ID DE CONFIGURACION A CONFIG_IDCONFIGURACION DEL USUARIO
    :NEW.CONFIG_IdConfiguracion := V_IDCONFIGURACION;
END;

--ASIGNAR IDS AUTOMATICAS A LAS ASIGNACIONES
CREATE OR REPLACE TRIGGER TRG_ASIGNACIONES_AUTO_ID
BEFORE INSERT ON ASIGNACIONES
FOR EACH ROW
WHEN (NEW.IDASIGNACION IS NULL OR NEW.IDASIGNACION = 0)
DECLARE
    V_IDASIGNACION NUMBER(5);
    V_EXISTS NUMBER(5);--PARA VERIFICAR QUE LA ID EXISTE
BEGIN
    LOOP
        --OBTENER VALOR DE LA SECUENCIA
        SELECT ASIGNACIONES_SEQ.NEXTVAL INTO V_IDASIGNACION FROM dual;
        --HACER UN COUNT PARA VER SI NEXTVAL YA EXISTE
        SELECT COUNT(*) INTO V_EXISTS FROM ASIGNACIONES WHERE IDASIGNACION = V_IDASIGNACION;
        --SALIR DEL BUCLE SI LA NEXTVAL NO ESTA EN LA TABLA
        EXIT WHEN V_EXISTS = 0;
    END LOOP;
    --ASIGNAR LA NUEVA ID
    :NEW.IDASIGNACION := V_IDASIGNACION;
END;

--ASIGNAR IDS AUTOMATICAS A LAS METRICAS
CREATE OR REPLACE TRIGGER TRG_METRICAS_AUTO_ID
BEFORE INSERT ON METRICAS
FOR EACH ROW
WHEN (NEW.IDMETRICA IS NULL OR NEW.IDMETRICA = 0)
DECLARE
    V_IDMETRICA NUMBER(5);
    V_EXISTS NUMBER(5);--PARA VERIFICAR QUE LA ID EXISTE
BEGIN
    LOOP
        --OBTENER VALOR DE LA SECUENCIA
        SELECT METRICAS_SEQ.NEXTVAL INTO V_IDMETRICA FROM dual;
        --HACER UN COUNT PARA VER SI NEXTVAL YA EXISTE
        SELECT COUNT(*) INTO V_EXISTS FROM METRICAS WHERE IDMETRICA = V_IDMETRICA;
        --SALIR DEL BUCLE SI LA NEXTVAL NO ESTA EN LA TABLA
        EXIT WHEN V_EXISTS = 0;
    END LOOP;
    --ASIGNAR LA NUEVA ID
    :NEW.IDMETRICA := V_IDMETRICA;
END;
--INSERTAR FECHA ACTUAL A LAS METRICAS
CREATE OR REPLACE TRIGGER TRG_METRICAS_SET_DATE
BEFORE INSERT ON METRICAS
FOR EACH ROW
BEGIN
    :NEW.FECHA := SYSDATE;
END;

--ASIGNAR IDS AUTOMATICAS A LAS SALAS
CREATE OR REPLACE TRIGGER TRG_SALAS_AUTO_ID
BEFORE INSERT ON SALAS
FOR EACH ROW
WHEN (NEW.IDSALA IS NULL OR NEW.IDSALA = 0)
DECLARE
    V_IDSALA NUMBER(5);
    V_EXISTS NUMBER(5);--PARA VERIFICAR QUE LA ID EXISTE
BEGIN
    LOOP
        --OBTENER VALOR DE LA SECUENCIA
        SELECT SALAS_SEQ.NEXTVAL INTO V_IDSALA FROM dual;
        --HACER UN COUNT PARA VER SI NEXTVAL YA EXISTE
        SELECT COUNT(*) INTO V_EXISTS FROM SALAS WHERE IDSALA = V_IDSALA;
        --SALIR DEL BUCLE SI LA NEXTVAL NO ESTA EN LA TABLA
        EXIT WHEN V_EXISTS = 0;
    END LOOP;
    --ASIGNAR LA NUEVA ID
    :NEW.IDSALA := V_IDSALA;
END;

--ASIGNAR IDS AUTOMATICAS A LAS SECCIONES
CREATE OR REPLACE TRIGGER TRG_SECCIONES_AUTO_ID
BEFORE INSERT ON SECCIONES
FOR EACH ROW
WHEN (NEW.IDSECCION IS NULL OR NEW.IDSECCION = 0)
DECLARE
    V_IDSECCION NUMBER(5);
    V_EXISTS NUMBER(5);--PARA VERIFICAR QUE LA ID EXISTE
BEGIN
    LOOP
        --OBTENER VALOR DE LA SECUENCIA
        SELECT SECCIONES_SEQ.NEXTVAL INTO V_IDSECCION FROM dual;
        --HACER UN COUNT PARA VER SI NEXTVAL YA EXISTE
        SELECT COUNT(*) INTO V_EXISTS FROM SECCIONES WHERE IDSECCION = V_IDSECCION;
        --SALIR DEL BUCLE SI LA NEXTVAL NO ESTA EN LA TABLA
        EXIT WHEN V_EXISTS = 0;
    END LOOP;
    --ASIGNAR LA NUEVA ID
    :NEW.IDSECCION := V_IDSECCION;
END;