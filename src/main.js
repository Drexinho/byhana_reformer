import './style.css'

const CONTACT_EMAIL = 'info@byhana-reformer.cz'

function initMobileMenu() {
  const btn = document.getElementById('menu-toggle') || document.getElementById('menu-btn')
  const menu = document.getElementById('mobile-menu')
  if (!btn || !menu) return

  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden')
    menu.classList.toggle('hidden')
    btn.setAttribute('aria-expanded', String(!isOpen))
  })

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden')
      btn.setAttribute('aria-expanded', 'false')
    })
  })
}

function initReservationForm() {
  const form = document.getElementById('reservation-form')
  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = form.querySelector('[name="name"]')?.value || ''
    const email = form.querySelector('[name="email"]')?.value || ''
    const phone = form.querySelector('[name="phone"]')?.value || ''
    const lesson = form.querySelector('[name="lesson"]')?.value || ''
    const date = form.querySelector('[name="date"]')?.value || ''
    const time = form.querySelector('[name="time"]')?.value || ''
    const note = form.querySelector('[name="note"]')?.value || ''
    const subject = encodeURIComponent(`Rezervace lekce: ${lesson} – ${date} ${time}`)
    const body = encodeURIComponent(
      `Jméno: ${name}\nE-mail: ${email}\nTelefon: ${phone}\nLekce: ${lesson}\nDatum: ${date}\nČas: ${time}\nPoznámka: ${note}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  })
}

function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll')
  if (!els.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
  )
  els.forEach((el) => observer.observe(el))
}

function initPageLoader() {
  const loader = document.getElementById('page-loader')
  if (!loader) return

  const minShowMs = 700
  const start = Date.now()

  function hideLoader() {
    const elapsed = Date.now() - start
    const delay = Math.max(0, minShowMs - elapsed)
    setTimeout(() => {
      loader.classList.add('hidden')
    }, delay)
  }

  if (document.readyState === 'complete') {
    hideLoader()
  } else {
    window.addEventListener('load', hideLoader)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader()
  initMobileMenu()
  initReservationForm()
  initScrollAnimations()
})
