using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Service_Booking_and_management_APP.Models;

namespace Service_Booking_and_management_APP.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        [Route("splash")]
        public IActionResult Index()
        {
            return View();
        }
        [Route("registration")]
        public IActionResult Registration()
        {
            return View();
        }

        [Route("verify-email")]
        public IActionResult Verify_Email()
        {
            return View();
        }

        [Route("login")]
        public IActionResult Login()
        {
            return View();
        }

        [Route("forgot-password")]
        public IActionResult Forgot_Password()
        {
            return View();
        }

        [Route("reset-password")]
        public IActionResult Reset_Password()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
