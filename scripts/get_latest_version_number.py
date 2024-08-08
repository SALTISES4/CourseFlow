import requests


def get_latest_version(package_name):
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data["info"]["version"]
    else:
        return "Package not found or error in fetching package."


# Replace 'package-name' with the actual name of the PyPI package.
package_name = "SALTISE-course-flow"
print(get_latest_version(package_name))
