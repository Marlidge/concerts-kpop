"""
Tests de la déduplication (votre §9, §28).

Le premier cas ci-dessous n'est pas inventé : ce sont, mot pour mot,
les deux entrées ENHYPEN trouvées à l'étape 14 dans les vraies données
Ticketmaster. Un vrai doublon vaut mieux qu'un exemple imaginé pour
vérifier que la fonction fait ce qu'on croit qu'elle fait.
"""

from dedupe import deduplicate
from normalize import NormalizedConcert


def make_concert(**overrides) -> NormalizedConcert:
    """Un concert valide par défaut ; on ne précise que ce qui varie
    d'un test à l'autre, pour que chaque test reste lisible."""
    defaults = dict(
        artist_id="artist-enhypen",
        title="ENHYPEN",
        date="2027-02-27",
        time="19:30",
        city="Nanterre",
        region="Île-de-France",
        venue="PLENITUDE ARENA",
        address=None,
        genre="kpop",
        ticket_status="on_sale",
        tickets_open_at="2026-04-24T07:59:46Z",
        price_min=None,
        price_max=None,
        official_url="https://example.com/enhypen",
        image_url=None,
        source="ticketmaster",
        source_id="event-1",
        first_seen_at="2026-09-24T09:00:00+00:00",
        updated_at="2026-09-24T09:00:00+00:00",
    )
    defaults.update(overrides)
    return NormalizedConcert(**defaults)


def test_no_duplicates_left_untouched():
    """Deux concerts d'artistes différents ne doivent jamais fusionner."""
    a = make_concert(artist_id="artist-a", source_id="a1")
    b = make_concert(artist_id="artist-b", source_id="b1")

    result = deduplicate([a, b])

    assert len(result) == 2


def test_real_enhypen_duplicate_is_merged():
    """
    Le cas réel : deux entrées Ticketmaster pour le même concert,
    l'une pour l'offre standard, l'autre pour le pass VIP.
    """
    standard = make_concert(
        title="ENHYPEN",
        source_id="ZkyMmBwZ1A7G_Gp",
        tickets_open_at="2026-04-24T07:59:46Z",
    )
    package = make_concert(
        title="PACKAGE ENHYPEN",
        source_id="Z1yMmBwZkk66",
        tickets_open_at="2026-04-22T08:00:00Z",  # ouverte deux jours plus tôt
    )

    result = deduplicate([standard, package])

    assert len(result) == 1
    merged = result[0]
    # Le titre le plus court l'emporte : "PACKAGE ENHYPEN" est la
    # variante, "ENHYPEN" le nom du concert lui-même.
    assert merged.title == "ENHYPEN"
    # La date d'ouverture la plus précoce est conservée : c'est le
    # vrai premier moment où la billetterie a ouvert.
    assert merged.tickets_open_at == "2026-04-22T08:00:00Z"


def test_venue_matching_ignores_case_and_accents():
    """"Accor Arena" et "ACCOR ARENA" doivent être reconnues comme la
    même salle, sinon la moindre variation d'écriture casse la détection."""
    a = make_concert(venue="Accor Arena", source_id="a1")
    b = make_concert(venue="ACCOR ARENA", source_id="a2")

    result = deduplicate([a, b])

    assert len(result) == 1


def test_different_dates_are_not_merged():
    """Deux concerts du même artiste, à la même salle, mais deux soirs
    différents : ce sont deux concerts, pas un doublon."""
    night_one = make_concert(date="2027-02-27", source_id="a1")
    night_two = make_concert(date="2027-02-28", source_id="a2")

    result = deduplicate([night_one, night_two])

    assert len(result) == 2


def test_cancelled_status_wins_over_on_sale():
    """Si une des entrées dit "annulé", le concert fusionné doit rester
    signalé comme annulé, même si une autre variante dit encore "en vente"."""
    on_sale = make_concert(ticket_status="on_sale", source_id="a1")
    cancelled = make_concert(ticket_status="cancelled", source_id="a2")

    merged = deduplicate([on_sale, cancelled])[0]

    assert merged.ticket_status == "cancelled"


def test_price_range_is_the_union_of_known_prices():
    """Quand les entrées connaissent des prix différents, le concert
    fusionné doit couvrir la fourchette la plus large observée."""
    cheap = make_concert(price_min=45.0, price_max=90.0, source_id="a1")
    expensive = make_concert(price_min=60.0, price_max=150.0, source_id="a2")

    merged = deduplicate([cheap, expensive])[0]

    assert merged.price_min == 45.0
    assert merged.price_max == 150.0


def test_missing_price_does_not_erase_a_known_price():
    """Une entrée sans prix ne doit jamais faire disparaître un prix
    connu trouvé sur une autre entrée du même concert."""
    with_price = make_concert(price_min=50.0, price_max=100.0, source_id="a1")
    without_price = make_concert(price_min=None, price_max=None, source_id="a2")

    merged = deduplicate([with_price, without_price])[0]

    assert merged.price_min == 50.0
    assert merged.price_max == 100.0


def test_first_seen_at_keeps_the_earliest_date():
    """La date de première découverte doit être la plus ancienne des
    deux, jamais la plus récente : elle ne doit plus bouger une fois fixée."""
    seen_first = make_concert(
        first_seen_at="2026-01-01T00:00:00+00:00", source_id="a1"
    )
    seen_later = make_concert(
        first_seen_at="2026-06-01T00:00:00+00:00", source_id="a2"
    )

    merged = deduplicate([seen_first, seen_later])[0]

    assert merged.first_seen_at == "2026-01-01T00:00:00+00:00"
