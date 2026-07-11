import ReservationForm from '../ReservationForm/ReservationForm'

const restaurantInfo = {
  location: {
    line1: 'Smart Dine In',
    line2: 'Restaurant Location',
  },
  hours: {
    line1: 'Open Daily',
    line2: '12:00 PM — 11:00 PM',
  },
}

export default function Footer() {
  return (
    <footer
      id="reserve"
      className="relative border-t border-white/10 pt-20 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <p
          aria-hidden="true"
          className="font-display font-bold text-[18vw] md:text-[11rem] leading-none text-white/[0.04] select-none -mb-6 md:-mb-10 whitespace-nowrap"
        >
          RESERVE
        </p>

        <div className="relative z-10 grid md:grid-cols-2 gap-14 pb-16">
          <div>
            <p className="eyebrow mb-4">Reserve Your Table</p>

            <h3 className="font-display italic text-3xl mb-8 max-w-sm">
              A seat at the fire is never guaranteed. Ask, and we&apos;ll
              find you one.
            </h3>

            <ReservationForm />
          </div>

          <div className="md:pl-10 md:border-l border-white/10 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="eyebrow mb-3">Location</p>

                <p className="text-bone text-sm">
                  {restaurantInfo.location.line1}
                </p>

                <p className="text-bone-dim text-sm">
                  {restaurantInfo.location.line2}
                </p>
              </div>

              <div>
                <p className="eyebrow mb-3">Hours</p>

                <p className="text-bone text-sm">
                  {restaurantInfo.hours.line1}
                </p>

                <p className="text-bone-dim text-sm">
                  {restaurantInfo.hours.line2}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-bone-faint">
              <span>
                &copy; {new Date().getFullYear()} Noir &amp; Sel Group
              </span>

              <div className="flex gap-6">
                <a
                  href="#"
                  className="hover:text-bone transition-colors"
                >
                  Instagram
                </a>

                <a
                  href="#"
                  className="hover:text-bone transition-colors"
                >
                  Journal
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}