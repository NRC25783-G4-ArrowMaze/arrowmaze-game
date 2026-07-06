# G2-internacionalizacion.feature

Feature: Internacionalización y cambio de idioma (ES / EN)
  Como jugador en un cliente web/Android
  Quiero que la interfaz se muestre en mi idioma (español o inglés) y poder cambiarlo desde Ajustes
  Para entender la interfaz sin depender de un idioma fijo

  # ─────────────────────────────────────────────
  # CONCEPTOS CLAVE
  #
  # Catálogo      : Diccionario externalizado de claves → traducciones, uno por
  #                 idioma soportado (es, en). Ninguna cadena visible vive
  #                 hardcodeada en los componentes.
  # Locale        : Idioma del sistema/dispositivo leído en el primer arranque.
  # Preferencia   : Idioma elegido por el usuario, persistido a nivel de
  #                 usuario/perfil (mecanismo según D1); prevalece sobre el locale.
  # Ajustes       : Pantalla de C4 donde vive el selector de idioma.
  # ─────────────────────────────────────────────
  #
  # INVARIANTE CENTRAL
  #
  # La i18n es un asunto exclusivo de PRESENTACIÓN. El dominio (A1–A5), los
  # DTOs de niveles (C2) y los contratos de API no cambian con el idioma:
  # cambiar de idioma jamás altera el estado de la partida ni el score.
  #
  # DECISIONES DE DISEÑO (sesión SDD 2026-07-04)
  #   P24 Alcance          : SOLO UI. El contenido de los niveles (`name` y demás
  #                          textos de `LevelData`) se muestra tal cual viene del
  #                          JSON; no tiene variantes por idioma en v1.
  #   D1  Idiomas          : ES y EN. Idioma por defecto = locale del dispositivo:
  #                          si es español → ES; cualquier otro → EN (fallback).
  #   D2  Preferencia      : A NIVEL DE USUARIO. Se persiste y en arranques
  #                          posteriores prevalece sobre el locale del dispositivo.
  #   D3  Cambio           : EN CALIENTE. Toda la UI se re-renderiza sin reiniciar
  #                          la app ni perder el estado de la partida.
  #   D4  Clave faltante   : FALLBACK A INGLÉS. Si una clave no existe en el
  #                          catálogo del idioma activo, se muestra su valor en EN.

  Background: un cliente con catálogos de cadenas externalizados
    Given existen catálogos de traducción para "es" y "en" con las mismas claves
    And ninguna cadena visible de la UI está hardcodeada en los componentes

  Rule: El idioma inicial se resuelve por preferencia guardada y, si no hay, por locale (D1, D2)

    Scenario: Primer arranque en un dispositivo en español
      Given no existe preferencia de idioma guardada
      And el locale del dispositivo es "es-VE"
      When la aplicación arranca
      Then la UI se muestra en español

    Scenario: Primer arranque en un dispositivo en inglés
      Given no existe preferencia de idioma guardada
      And el locale del dispositivo es "en-US"
      When la aplicación arranca
      Then la UI se muestra en inglés

    Scenario Outline: Cualquier locale no soportado cae a inglés
      Given no existe preferencia de idioma guardada
      And el locale del dispositivo es "<locale>"
      When la aplicación arranca
      Then la UI se muestra en inglés

      Examples:
        | locale |
        | fr-FR  |
        | pt-BR  |
        | de-DE  |

    Scenario: La preferencia guardada prevalece sobre el locale del dispositivo
      Given el usuario guardó previamente la preferencia de idioma "es"
      And el locale del dispositivo es "en-US"
      When la aplicación arranca
      Then la UI se muestra en español

  Rule: El cambio de idioma es accesible desde Ajustes y aplica en caliente (D3)

    Scenario: Cambiar de español a inglés re-renderiza toda la UI
      Given la UI está en español
      And el jugador está en la pantalla de Ajustes (C4)
      When selecciona el idioma "English"
      Then toda la UI visible pasa a mostrarse en inglés de inmediato
      And no se requiere reiniciar la aplicación

    Scenario: Cambiar de idioma en medio de una partida no altera el juego
      Given una partida IN_PROGRESS con flechas colocadas y movimientos consumidos
      When el jugador cambia el idioma desde Ajustes y regresa a la partida
      Then el estado del tablero, las flechas y los movimientos restantes son idénticos
      And el score potencial (A5) no se ve afectado
      And solo los textos de la interfaz cambiaron de idioma

    Scenario: La preferencia elegida se persiste para próximos arranques
      Given el locale del dispositivo es "en-US"
      And el jugador cambió el idioma a "Español" en Ajustes
      When cierra y vuelve a abrir la aplicación
      Then la UI arranca directamente en español
      And la preferencia sigue prevaleciendo sobre el locale del dispositivo

  Rule: Toda cadena visible sale del catálogo, con fallback a inglés (D4)

    Scenario: Una clave faltante en español se muestra en inglés
      Given la UI está en español
      And la clave "settings.audio.title" no existe en el catálogo "es"
      And sí existe en el catálogo "en"
      When se renderiza la pantalla que usa esa clave
      Then se muestra el valor en inglés de "settings.audio.title"
      And la aplicación no falla ni muestra la clave literal

    Scenario: Los textos dinámicos usan claves con parámetros
      Given el catálogo define la clave "game.movesLeft" con un parámetro numérico
      When la UI muestra los movimientos restantes en ambos idiomas
      Then el número se interpola en la plantilla del idioma activo
      And la concatenación manual de fragmentos de texto no se utiliza

  Rule: El contenido de los niveles queda fuera del alcance de i18n (P24)

    Scenario: El nombre del nivel se muestra tal cual viene del LevelData
      Given un `LevelData` con "name": "Nivel Inicial"
      And la UI está en inglés
      When se muestra la pantalla del nivel
      Then el nombre mostrado es exactamente "Nivel Inicial"
      And ningún catálogo de traducción se consulta para el contenido del nivel

    Scenario: Cambiar de idioma no re-solicita ni transforma los niveles
      Given un catálogo de niveles ya cargado (C2)
      When el jugador cambia el idioma de la UI
      Then los `LevelData` en memoria permanecen byte a byte iguales
      And no se dispara ninguna recarga de niveles por el cambio de idioma
